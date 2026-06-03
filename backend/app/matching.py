from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Iterable, List

from .data_loader import CATALOG, CUSTOMER_HISTORY
from .schemas import ExtractedItem, ExtractedOrder, MatchedItem, MatchedOrder, Product, ProductCandidate

SYNONYMS = {
    "oil": "oel",
    "ol": "oel",
    "oele": "oel",
    "oleo": "oel",
    "sunflower": "sonnenblumenoel",
    "sunfloweroil": "sonnenblumenoel",
    "egg": "eier",
    "eggs": "eier",
    "large": "l",
    "puree": "puree",
    "piree": "puree",
    "pueree": "puree",
    "fruchtpueree": "fruchtpuree",
    "potato": "kartoffel",
    "salad": "salat",
    # Marmelade / Jam synonyms
    "marmelade": "konfiture",
    "marmellata": "konfiture",
    "konfituere": "konfiture",
    "konfiture": "konfiture",
    "jam": "konfiture",
    # Berry root normalizations
    "brombeere": "brombeer",
    "brombeeren": "brombeer",
    "erdbeere": "erdbeer",
    "erdbeeren": "erdbeer",
    "himbeere": "himbeer",
    "himbeeren": "himbeer",
}

# Synonym concepts map representing multi-word mappings or multiple alternative terms
SYNONYM_CONCEPTS = {
    "ronen": [{"rote"}, {"bete"}],
    "laugenstein": [{"atznatron", "lauge", "natron"}],
}

GERMAN_COMPOUND_SUFFIXES = [
    "marmelade", "konfituere", "konfiture", "joghurt", "saft", "milch", 
    "speck", "butter", "kaese", "kase", "alpin", "puree"
]

def split_compounds(token: str) -> List[str]:
    if token in GERMAN_COMPOUND_SUFFIXES:
        return [token]
    for suffix in GERMAN_COMPOUND_SUFFIXES:
        if token.endswith(suffix) and len(token) > len(suffix):
            prefix = token[:-len(suffix)]
            if prefix.endswith("n") and len(prefix) > 2:
                prefix = prefix[:-1]
            return [prefix, suffix]
    return [token]

# Words that denote sizes, packages, types, or adjectives and should not trigger multi-item splitting
NON_PRODUCT_WORDS = {
    # Adjectives / Descriptors
    "frisch", "frische", "frischer", "frisches",
    "gefroren", "gefr", "gefrorene", "gefrorener", "gefrorenes",
    "kalt", "kalte", "kalter", "kaltes",
    "heiss", "heisse", "heisser", "heisses", "heiß", "heiße", "heißer", "heißes",
    "gross", "grosse", "grosser", "grosses", "groß", "große", "großer", "großes",
    "klein", "kleine", "kleiner", "kleines",
    "hausgemacht", "hausgemachte", "hausgemachter", "hausgemachtes",
    "mild", "milde", "milder", "mildes",
    "scharf", "scharfe", "scharfer", "scharfes",
    "rot", "rote", "roter", "rotes",
    "weiss", "weisse", "weisser", "weisses", "weiß", "weiße", "weißer", "weißes",
    "gruen", "gruene", "gruener", "gruenes", "grün", "grüne", "grüner", "grünes",
    "gelb", "gelbe", "gelber", "gelbes",
    "schwarz", "schwarze", "schwarzer", "schwarzes",
    "bio", "alkoholfrei", "alkoholfreie", "alkoholfreier", "alkoholfreies",
    "gastro", "trocken", "trockene", "trockener", "trockenes",
    "suess", "suesse", "suesser", "suesses", "süß", "süße", "süßer", "süßes",
    "scheiben", "scheibe", "streifen", "stuck", "stück", "stücke", "stuecke",
    "mit", "schale", "ohne", "f", "und", "oder",
    # Italian descriptors / descriptors in general
    "affettato", "affettati", "fette", "fetta", "fresco", "fresca", "freschi", "fresche",
    "congelato", "congelati", "gelo", "surgelato", "surgelati", "taglio", "pezzo", "pezzi", "pz",
    # Units / package details
    "stk", "stck", "stuck", "stück", "kg", "g", "l", "ml", "cl",
    "flasche", "flaschen", "fl", "dose", "dosen", "ds", "karton", "krt", "eimer", "eim",
    "sack", "saecke", "säcke", "packung", "pkg", "packungen", "tuete", "tute", "tuten", "tüten",
    "glas", "glaeser", "gläser", "beutel", "schale", "schalen", "rolle", "rollen", "tube", "tuben",
    "portion", "portionen", "port",
}

# Harmless brand names, styles, or prefixes that should be ignored for position penalty calculations
HARMLESS_PREFIXES = {
    "country", "mccain", "orogel", "develey", "heinz", "hellmann", "calve", "biffi", "orco", 
    "menu", "zuccato", "felix", "brimi", "sterzinger", "big", "chef", "aroy", "d", "mannius", 
    "mutti", "stolz", "alpin", "herbs"
}


def normalize(value: str) -> str:
    value = value.lower()
    value = (
        value.replace("ß", "ss")
        .replace("ae", "a")
        .replace("oe", "o")
        .replace("ue", "u")
    )
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def tokens(value: str) -> List[str]:
    result = []
    for token in normalize(value).split():
        for sub_token in split_compounds(token):
            result.append(SYNONYMS.get(sub_token, sub_token))
    return result


def is_clearly_product_name(text: str) -> bool:
    text_clean = text.lower().strip()
    if not text_clean:
        return False
    # If it is purely numeric or matches a quantity/unit pattern (e.g. "5 kg", "10l", "1 stück")
    if re.match(r"^\d+\s*(kg|g|l|ml|cl|stk|stck|stuck|stück|flasche|flaschen|dose|dosen|krt|karton|eimer|eim|sack|säcke|pkg|packung|glas|gläser|glaeser|p\.|pcs|st|k\.)?$", text_clean):
        return False
    # If the word itself is in the ignore set
    if text_clean in NON_PRODUCT_WORDS:
        return False
    words = text_clean.split()
    if len(words) == 1 and words[0] in NON_PRODUCT_WORDS:
        return False
    # If all constituent words are non-product descriptors or numeric
    if all(word in NON_PRODUCT_WORDS or re.match(r"^\d+$", word) for word in words):
        return False
    return True


def split_multi_items(raw_text: str) -> List[str]:
    # Split on commas, or case-insensitive "und" / "and"
    parts = re.split(r',|\bund\b|\band\b', raw_text, flags=re.IGNORECASE)
    cleaned_parts = [p.strip() for p in parts if p.strip()]
    if len(cleaned_parts) <= 1:
        return [raw_text]
    # Only split if ALL resulting parts look like valid product names
    if all(is_clearly_product_name(p) for p in cleaned_parts):
        return cleaned_parts
    return [raw_text]


def get_query_concepts(query: str) -> List[set[str]]:
    concepts = []
    for token in normalize(query).split():
        for sub_token in split_compounds(token):
            if sub_token in SYNONYM_CONCEPTS:
                concepts.extend(SYNONYM_CONCEPTS[sub_token])
            else:
                mapped = SYNONYMS.get(sub_token, sub_token)
                concepts.append({mapped})
    return concepts


def is_item_code_like(query: str) -> bool:
    clean = query.strip()
    if not clean or " " in clean:
        return False
    if 3 <= len(clean) <= 10 and clean.isalnum():
        return bool(re.match(r"^[A-Za-z0-9]+$", clean))
    return False


def calculate_field_score(query_concepts: List[set[str]], query_tokens: List[str], field_val: str, is_template_product: bool = False) -> int:
    if not field_val:
        return 0
    field_norm = normalize(field_val)
    if not field_norm:
        return 0
        
    query_norm = " ".join(query_tokens)
    seq_ratio = round(100 * SequenceMatcher(None, query_norm, field_norm).ratio())
    
    field_tokens_list = tokens(field_val)
    field_tokens_set = set(field_tokens_list)
    
    if not query_concepts or not field_tokens_set:
        return seq_ratio
        
    matched_concepts = 0
    weighted_overlap = 0.0
    has_synonym_match = False
    
    for concept in query_concepts:
        match_idx = -1
        matched_word = None
        effective_idx = 0
        for idx, token in enumerate(field_tokens_list):
            is_match = False
            for c_word in concept:
                if token == c_word:
                    is_match = True
                    break
                # Fuzzy match for tokens of length >= 4
                if len(token) >= 4 and len(c_word) >= 4:
                    if abs(len(token) - len(c_word)) <= 2:
                        if SequenceMatcher(None, token, c_word).ratio() >= 0.82:
                            is_match = True
                            break
                # Substring match for German compound words (length >= 5)
                if len(token) >= 5 and len(c_word) >= 5:
                    if token in c_word or c_word in token:
                        is_match = True
                        break
            
            if is_match:
                match_idx = effective_idx
                matched_word = token
                break
            # Skip harmless brands, prefixes, and unit descriptors when calculating index
            if token not in HARMLESS_PREFIXES and token not in NON_PRODUCT_WORDS:
                effective_idx += 1
                
        if match_idx != -1:
            matched_concepts += 1
            if matched_word not in query_tokens:
                has_synonym_match = True
                
            # Apply position penalties: higher weight for earlier core product tokens
            if match_idx == 0:
                weight = 1.0
            elif match_idx == 1:
                weight = 0.8
            elif match_idx == 2:
                weight = 0.6
            else:
                weight = 0.3
            weighted_overlap += weight
            
    if matched_concepts == 0:
        return 0
        
    overlap_score = 100 * (weighted_overlap / len(query_concepts))
    
    # Length penalty: 2 points per unmatched token in product description to reward specificity
    len_penalty = max(0, (len(field_tokens_set) - len(query_concepts)) * 2)
    
    # Reduce length penalty for trusted customer template products when query is a single concept
    if is_template_product and len(query_concepts) == 1:
        len_penalty = round(len_penalty * 0.25)
        
    overlap_score = max(0.0, overlap_score - len_penalty)
    
    # Synonym match penalty (small reduction to avoid automatic 100% confidence)
    if has_synonym_match:
        overlap_score = max(0.0, overlap_score - 5)
        
    return max(seq_ratio, round(overlap_score))


def history_products(customer_code: str) -> List[Product]:
    history_codes = set(CUSTOMER_HISTORY.get(customer_code, []))
    return [product for product in CATALOG if product.code in history_codes]


def adjust_score_for_variants(product: Product, query_text: str, unit_hint: Optional[str], notes: Optional[str]) -> int:
    query_norm = normalize(query_text)
    unit_norm = normalize(unit_hint) if unit_hint else ""
    notes_norm = normalize(notes) if notes else ""
    
    # Combined hints and product text
    hints = f" {query_norm} {unit_norm} {notes_norm} "
    prod_text = f" {normalize(product.description)} {normalize(product.package_size)} "
    
    # Split into exact word sets to prevent prefix/substring matching bugs (e.g. "m" matching "mayonnaise")
    hint_words = set(hints.split())
    prod_words = set(prod_text.split())
    p_unit = product.unit.lower()
    
    adjustment = 0
    
    # 1. Portion vs Bulk
    portion_keywords = {"portion", "portionen", "port", "pz", "monodessert", "mono", "mini", "kleine", "p"}
    bulk_keywords = {"5kg", "3kg", "10kg", "10l", "5l", "eimer", "kan", "gastro"}
    
    has_portion_hint = bool(portion_keywords & hint_words)
    has_bulk_hint = bool(bulk_keywords & hint_words)
    
    is_portion_product = bool(set(["portion", "portionen", "port", "mono", "mini", "kleine"]) & prod_words) or \
                         any(w in prod_text for w in ["10g", "15g", "15ml", "20ml", "25g", "33ml"])
    is_bulk_product = any(w in prod_text for w in bulk_keywords)
    
    # Multi-variant exemption: if order text specifies both portions and bulk, skip mismatch penalty
    skip_portion_bulk_penalty = has_portion_hint and has_bulk_hint
    
    if has_portion_hint:
        if is_portion_product:
            adjustment += 10
        elif not skip_portion_bulk_penalty:
            adjustment -= 15
            
    if has_bulk_hint:
        if is_bulk_product:
            adjustment += 10
        elif not skip_portion_bulk_penalty:
            adjustment -= 15
            
    # 2. General Size indicators (Large vs Small)
    # Remove "l" and "m" to avoid conflicts with Liter/Meter unit suffixes
    large_keywords = {"gross", "groß", "grosse", "large"}
    small_keywords = {"klein", "kleine", "small"}
    
    has_large_hint = bool(large_keywords & hint_words)
    has_small_hint = bool(small_keywords & hint_words)
    
    is_large_product = any(w in prod_text for w in ["20ml", "20g", "25g", "5kg", "3kg"])
    is_small_product = any(w in prod_text for w in ["15ml", "15g", "10g"])
    
    skip_large_small_penalty = has_large_hint and has_small_hint
    
    if has_large_hint:
        if is_large_product:
            adjustment += 10
        if is_small_product and not skip_large_small_penalty:
            adjustment -= 15
            
    if has_small_hint:
        if is_small_product:
            adjustment += 10
        if is_large_product and not skip_large_small_penalty:
            adjustment -= 15
            
    # 3. Glove/sized product size matching (checks M, L, S, XL)
    is_glove_or_sized = "handschuhe" in prod_text or "guante" in query_norm or "handschuhe" in query_norm
    if is_glove_or_sized:
        has_l_hint = "l" in hint_words or "large" in hint_words
        has_m_hint = "m" in hint_words or "medium" in hint_words
        has_s_hint = "s" in hint_words or "small" in hint_words
        
        is_l_product = " l " in prod_text or "l 8" in prod_text or "large" in prod_text
        is_m_product = " m " in prod_text or "m 7" in prod_text or "medium" in prod_text
        is_s_product = " s " in prod_text or "s 6" in prod_text or "small" in prod_text
        
        skip_glove_penalty = has_l_hint and has_m_hint
        
        if has_l_hint:
            if is_l_product:
                adjustment += 20
            if (is_m_product or is_s_product) and not skip_glove_penalty:
                adjustment -= 25
        elif has_m_hint:
            if is_m_product:
                adjustment += 20
            if (is_l_product or is_s_product) and not skip_glove_penalty:
                adjustment -= 25
                
    # 4. Strict Capacity Matching (extract numbers followed by g, kg, ml, l)
    qty_pattern = r"\b(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b"
    query_qtys = re.findall(qty_pattern, hints)
    prod_qtys = re.findall(qty_pattern, prod_text)
    
    if query_qtys:
        query_set = set()
        for val, unit in query_qtys:
            val_f = float(val.replace(",", "."))
            if unit == "kg":
                val_f *= 1000
                unit = "g"
            elif unit == "l":
                val_f *= 1000
                unit = "ml"
            query_set.add((val_f, unit))
            
        prod_set = set()
        for val, unit in prod_qtys:
            val_f = float(val.replace(",", "."))
            if unit == "kg":
                val_f *= 1000
                unit = "g"
            elif unit == "l":
                val_f *= 1000
                unit = "ml"
            prod_set.add((val_f, unit))
            
        has_match = False
        has_mismatch = False
        for q_val, q_unit in query_set:
            matched_any = False
            for p_val, p_unit in prod_set:
                if q_unit == p_unit:
                    if abs(q_val - p_val) < 0.01:
                        matched_any = True
                    else:
                        has_mismatch = True
            if matched_any:
                has_match = True
                
        if has_match and not has_mismatch:
            adjustment += 20
        elif has_mismatch:
            adjustment -= 25
            
    # 5. Specialty Butter vs regular butter
    cacao_keywords = {"cacao", "kakao", "kakaobutter", "erdnuss", "erdnussbutter", "peanut", "arachidi"}
    is_specialty_butter = any(w in prod_text for w in cacao_keywords)
    has_cacao_hint = any(w in hints for w in {"cacao", "kakao", "kakaobutter", "erdnuss", "peanut", "arachidi"})
    if is_specialty_butter and not has_cacao_hint:
        adjustment -= 30
        
    # 6. Portion product penalty: portion products penalized if there is no portion hint
    is_portion_descr = bool(set(["portion", "portionen", "port"]) & prod_words) or \
                       any(w in prod_text for w in ["10g", "15g", "15ml", "20ml", "25g", "33ml"])
    if is_portion_descr and not has_portion_hint:
        adjustment -= 15

    # 7. Specialty potato styles
    specialty_potato = {"duchesse", "kroketten", "noisettes", "nocken", "roesti", "rosti", "roestinchen", "rostinchen"}
    if any(w in prod_text for w in specialty_potato):
        if not any(w in hints for w in specialty_potato):
            adjustment -= 15
            
    # 8. Product forms (Julienne vs Duchesse form)
    if "julienne" in hints:
        if "julienne" in prod_text:
            adjustment += 15
        if "duchesse" in prod_text:
            adjustment -= 20
    if "duchesse" in hints:
        if "duchesse" in prod_text:
            adjustment += 15
        if "julienne" in prod_text:
            adjustment -= 20
            
    # 9. Package type conflicts (Sack vs Karton vs Eimer)
    has_sack = any(u in hints for u in {"sack", "saecke", "säcke"})
    has_karton = any(u in hints for u in {"karton", "krt", "car"})
    has_eimer = any(u in hints for u in {"eimer", "eim"})
    
    is_sack_prod = "sac" in p_unit or "sack" in prod_text
    is_karton_prod = "krt" in p_unit or "karton" in prod_text
    is_eimer_prod = "eim" in p_unit or "eimer" in prod_text
    
    if has_sack:
        if is_sack_prod:
            adjustment += 10
        if is_karton_prod or is_eimer_prod:
            adjustment -= 15
            
    if has_karton:
        if is_karton_prod:
            adjustment += 10
        if is_sack_prod or is_eimer_prod:
            adjustment -= 15
            
    if has_eimer:
        if is_eimer_prod:
            adjustment += 10
        if is_sack_prod or is_karton_prod:
            adjustment -= 15
            
    # 10. Unit hints match
    unit_mappings = [
        ({"flasche", "fl", "fla"}, {"fla"}),
        ({"dose", "ds", "dos"}, {"dos"}),
        ({"beutel", "bg"}, {"beg", "sac"})
    ]
    for user_units, prod_units in unit_mappings:
        if any(u in hints for u in user_units):
            if any(pu in p_unit for pu in prod_units):
                adjustment += 5
                
    return adjustment


def has_concept_overlap(query_concepts: List[set[str]], product: Product, query_text: str) -> bool:
    clean_query = normalize(query_text)
    if clean_query == normalize(product.code):
        return True
    prod_tokens = set(tokens(product.description))
    for alias in product.aliases:
        prod_tokens.update(tokens(alias))
        
    for concept in query_concepts:
        for c_word in concept:
            if c_word in NON_PRODUCT_WORDS:
                continue
            if c_word in prod_tokens:
                return True
            for p_tok in prod_tokens:
                if p_tok in NON_PRODUCT_WORDS:
                    continue
                if len(p_tok) >= 5 and len(c_word) >= 5:
                    if p_tok in c_word or c_word in p_tok:
                        return True
                if len(p_tok) >= 4 and len(c_word) >= 4:
                    if abs(len(p_tok) - len(c_word)) <= 2:
                        if SequenceMatcher(None, p_tok, c_word).ratio() >= 0.82:
                            return True
    return False


def score_product(raw_text: str, product: Product, customer_code: str, unit_hint: Optional[str] = None, notes: Optional[str] = None) -> ProductCandidate:
    is_template_product = product.code in CUSTOMER_HISTORY.get(customer_code, [])
    is_code_query = is_item_code_like(raw_text)
    query_concepts = get_query_concepts(raw_text)
    query_tokens = normalize(raw_text).split()
    
    desc_scores = []
    
    # 1. German Description Score
    de_score = calculate_field_score(query_concepts, query_tokens, product.description, is_template_product)
    desc_scores.append(de_score)
    
    # 2. Italian / Alias Description Scores
    for alias in product.aliases:
        alias_score = calculate_field_score(query_concepts, query_tokens, alias, is_template_product)
        desc_scores.append(alias_score)
        
    best_desc_score = max(desc_scores) if desc_scores else 0
    
    # 3. Item Code Score
    code_score = calculate_field_score(query_concepts, query_tokens, product.code, is_template_product)
    
    # Combine scores depending on query type (ItemCode vs Description query)
    if is_code_query:
        base = max(code_score, best_desc_score)
    else:
        # Low weight for code matching unless explicitly queried
        base = max(best_desc_score, round(code_score * 0.2))
        
    # Apply history boost (25) to prioritize templates as ranking prior
    # Require base similarity >= 35 and actual concept token overlap to prevent false positive overrides
    should_boost = is_template_product and base >= 35 and has_concept_overlap(query_concepts, product, raw_text)
    history_boost = 25 if should_boost else 0
    score = base + history_boost
    
    # Apply variant adjustments to the score itself (after boost capping to prevent masking during sorting)
    var_adjustment = adjust_score_for_variants(product, raw_text, unit_hint, notes)
    score = max(0, score + var_adjustment)
    
    # Synonym detection: cap final score at 94 for synonym matches to prevent artificial 100% confidence
    has_synonym = False
    for concept in query_concepts:
        prod_tokens = set(tokens(product.description) + [t for a in product.aliases for t in tokens(a)])
        matched_syns = concept & prod_tokens
        if matched_syns and not (matched_syns & set(query_tokens)):
            has_synonym = True
            break
            
    if has_synonym:
        score = min(94, score)
        
    stage = "customer_template" if history_boost else "catalog"
    explanation = (
        f"Matched '{raw_text}' against {product.code}; base score {base}"
        f"{' plus customer-history boost' if history_boost else ''}."
    )
    return ProductCandidate(
        code=product.code,
        description=product.description,
        unit=product.unit,
        package_size=product.package_size,
        score=score,
        stage=stage,
        explanation=explanation,
    )


def rank_products(raw_text: str, products: List[Product], customer_code: str, unit_hint: Optional[str] = None, notes: Optional[str] = None) -> List[ProductCandidate]:
    ranked = [score_product(raw_text, product, customer_code, unit_hint, notes) for product in products]
    return sorted(ranked, key=lambda candidate: candidate.score, reverse=True)


def match_order(order: ExtractedOrder, customer_code: str, threshold: int = 85) -> MatchedOrder:
    matched_items: List[MatchedItem] = []
    template_products = history_products(customer_code)

    # 1. Conservative multi-item line splitting
    expanded_items: List[ExtractedItem] = []
    for item in order.items:
        split_names = split_multi_items(item.raw_text)
        if len(split_names) > 1:
            for name in split_names:
                expanded_items.append(
                    ExtractedItem(
                        raw_text=name,
                        quantity=item.quantity,
                        unit_hint=item.unit_hint,
                        notes=item.notes
                    )
                )
        else:
            expanded_items.append(item)

    # 1.5 Propagate portion/bulk hints among condiments in the same order
    condiment_keywords = {"ketchup", "mayonnaise", "senf", "dressing"}
    order_has_portion = False
    order_has_bulk = False
    
    for item in expanded_items:
        item_text = normalize(item.raw_text)
        item_unit = normalize(item.unit_hint) if item.unit_hint else ""
        item_notes = normalize(item.notes) if item.notes else ""
        combined = f" {item_text} {item_unit} {item_notes} "
        
        is_condiment = any(w in item_text for w in condiment_keywords)
        if is_condiment:
            portion_keywords = {"portion", "portionen", "port", "pz", "monodessert", "mono", "mini", "kleine", "p"}
            bulk_keywords = {"5kg", "3kg", "10kg", "10l", "5l", "eimer", "kan", "gastro"}
            words = set(combined.split())
            if bool(portion_keywords & words):
                order_has_portion = True
            if bool(bulk_keywords & words):
                order_has_bulk = True
                
    if order_has_portion or order_has_bulk:
        for item in expanded_items:
            item_text = normalize(item.raw_text)
            is_condiment = any(w in item_text for w in condiment_keywords)
            if is_condiment:
                portion_keywords = {"portion", "portionen", "port", "pz", "monodessert", "mono", "mini", "kleine", "p"}
                bulk_keywords = {"5kg", "3kg", "10kg", "10l", "5l", "eimer", "kan", "gastro"}
                
                item_unit = normalize(item.unit_hint) if item.unit_hint else ""
                item_notes = normalize(item.notes) if item.notes else ""
                combined = f" {item_text} {item_unit} {item_notes} "
                words = set(combined.split())
                
                has_own_portion = bool(portion_keywords & words)
                has_own_bulk = bool(bulk_keywords & words)
                
                if not has_own_portion and not has_own_bulk:
                    if order_has_portion:
                        if item.notes:
                            item.notes = item.notes + " portionen"
                        else:
                            item.notes = "portionen"
                    elif order_has_bulk:
                        if item.notes:
                            item.notes = item.notes + " gastro"
                        else:
                            item.notes = "gastro"

    # 2. Process each item (matching + confidence labeling + ambiguity detection)
    for item in expanded_items:
        template_ranked = rank_products(item.raw_text, template_products, customer_code, item.unit_hint, item.notes)
        selected = template_ranked[0] if template_ranked else None
        alternatives: List[ProductCandidate] = template_ranked[1:4]

        # Check if we have a strong unambiguous match in the customer template.
        # Bypass fallback catalog search and mark as high-confidence if it's the only template match.
        is_strong_unambiguous_template_match = False
        if selected and len(get_query_concepts(item.raw_text)) == 1:
            best_score = selected.score
            runner_up_score = alternatives[0].score if alternatives else 0
            if best_score - runner_up_score > 15:
                is_strong_unambiguous_template_match = True

        if selected and is_strong_unambiguous_template_match:
            # Ensure the score reflects a high-confidence match
            selected.score = max(selected.score, 95)

        if selected is None or (selected.score < threshold and not is_strong_unambiguous_template_match):
            full_ranked = rank_products(item.raw_text, CATALOG, customer_code, item.unit_hint, item.notes)
            if full_ranked:
                selected = full_ranked[0]
                selected.stage = "fallback_catalog"
                alternatives = [candidate for candidate in full_ranked[1:4] if candidate.code != selected.code]
            else:
                # Fallback if catalog is completely empty
                selected = ProductCandidate(
                    code="UNKNOWN",
                    description="Unknown Item",
                    unit="STK",
                    package_size="1",
                    score=0,
                    stage="none",
                    explanation="No catalog items available for matching."
                )
                alternatives = []

        # Cap all scores in selected and alternatives at 100 for final presentation
        if selected:
            selected.score = min(100, selected.score)
        for alt in alternatives:
            alt.score = min(100, alt.score)

        # Ambiguity detection: check if best alternative is within 5 points
        is_ambiguous = False
        if alternatives:
            score_diff = selected.score - alternatives[0].score
            if score_diff <= 5:
                is_ambiguous = True

        # Assign confidence level and validation_required flag
        if selected.score >= 95:
            if is_ambiguous:
                confidence_label = "REVIEW_RECOMMENDED"
                validation_required = True
            else:
                confidence_label = "HIGH_CONFIDENCE"
                validation_required = False
        elif 85 <= selected.score < 95:
            if is_ambiguous:
                confidence_label = "HUMAN_VALIDATION_REQUIRED"
                validation_required = True
            else:
                confidence_label = "REVIEW_RECOMMENDED"
                validation_required = False
        else:  # score < 85
            confidence_label = "HUMAN_VALIDATION_REQUIRED"
            validation_required = True

        matched_items.append(
            MatchedItem(
                raw_text=item.raw_text,
                requested_quantity=item.quantity,
                requested_unit_hint=item.unit_hint,
                selected=selected,
                confidence_label=confidence_label,
                validation_required=validation_required,
                alternatives=alternatives,
            )
        )

    return MatchedOrder(
        customer_code=customer_code,
        delivery_note=order.delivery_note,
        items=matched_items,
    )
