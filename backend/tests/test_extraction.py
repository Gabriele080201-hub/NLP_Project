from app.extraction import GeminiOrderExtractor


def test_extractor_demo_mode_by_default(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    extractor = GeminiOrderExtractor()
    assert extractor.live_enabled is False

    extracted = extractor.extract(text="Mango puree 1")
    assert extracted.customer_hint is None
    assert len(extracted.items) == 3
    assert extracted.items[0].raw_text == "Mango puree"
    assert extracted.items[0].quantity == 1.0
