import os
import pytest
from app.data_loader import load_all_data, CATALOG
from app.matching import match_order
from app.schemas import ExtractedItem, ExtractedOrder

def setup_module():
    # Load real masterdata for regression testing
    data_dir = "/Users/vandabaer/Desktop/NLP PROJECT/Start Data Project /OneDrive_1_5-25-2026"
    os.environ["DATA_DIR"] = data_dir
    load_all_data(data_dir)

def make_order(raw_text):
    return ExtractedOrder(
        raw_text=raw_text,
        delivery_note=None,
        items=[ExtractedItem(raw_text=raw_text, quantity=1.0, unit_hint=None)],
    )

def test_regression_brombeermarmelade():
    matched = match_order(make_order("Brombeermarmelade"), "B0491")
    item = matched.items[0]
    
    # Assert Brombeere Konfitüre wins and ranks above Orange Marmalade
    assert item.selected.code in ["CYB24", "MMB20", "MPB45"]
    assert item.selected.code != "MMO10"
    assert item.selected.score >= 70

def test_regression_speck_alto_adige_affettato():
    matched = match_order(make_order("Speck Alto Adige affettato"), "B0491")
    item = matched.items[0]
    
    # Assert Speck is matched instead of Edam cheese slices
    assert item.selected.code in ["SC59F", "SC63F", "DGS5F", "SX90F"]
    assert item.selected.code != "KS04F"
    assert item.selected.score >= 60

def test_regression_naturjoghurt_brimi():
    matched = match_order(make_order("Naturjoghurt Brimi"), "B0491")
    item = matched.items[0]
    
    # Assert customer history template boost is applied correctly
    assert item.selected.stage == "customer_template" or "boost" in item.selected.explanation
    assert item.selected.code in ["MI15F", "JO02F", "JO03F"]
