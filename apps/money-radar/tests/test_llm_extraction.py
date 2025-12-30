"""
Tests for LLM extraction module.
"""
import pytest


class TestExtractFromText:
    """Tests for the extract_from_text function."""

    @pytest.fixture
    def sample_texts(self):
        """Sample texts for testing extraction."""
        return {
            "mortgage": """
                I'm looking to buy my first home and I'm completely overwhelmed by the mortgage process.
                I've saved up £30k for a deposit but I'm not sure if I should fix for 2 or 5 years.
                Any advice would be appreciated.
            """,
            "debt": """
                I'm drowning in credit card debt - about £15k across 3 cards. I've tried balance transfers
                but keep spending more. Feeling really stressed about it. Has anyone used StepChange?
            """,
            "pension": """
                Just turned 40 and realised I have almost nothing in my pension. I've got about £20k
                in a workplace scheme from a previous job. Should I consolidate? What's the best way
                to catch up on retirement savings?
            """,
            "budgeting": """
                We're a family of 4 living in London and struggling to make ends meet. Our rent is £1800
                and after bills there's barely anything left. Looking for tips on how to budget better.
            """,
            "emergency_fund": """
                I've finally paid off all my debt! Now I want to build an emergency fund. How much should
                I aim for? 3 months or 6 months expenses? Where should I keep it - premium bonds or 
                easy access savings?
            """,
            "investing": """
                I've maxed out my ISA this year and have another £20k I want to invest. Should I open
                a GIA or wait until April? Looking at global index funds. Is Vanguard still the best
                option or are there cheaper alternatives now?
            """
        }

    def test_sample_texts_exist(self, sample_texts):
        """Verify sample texts are properly loaded."""
        assert len(sample_texts) == 6
        assert "mortgage" in sample_texts
        assert "debt" in sample_texts

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")
    def test_mortgage_extraction(self, sample_texts):
        """Test extraction from mortgage-related text."""
        from llm_extraction import extract_from_text
        
        result = extract_from_text(sample_texts["mortgage"])
        assert result is not None
        assert result["ukpf_stage"] == "mortgage"
        assert result["intent_type"] in ["seeking_advice", "researching"]
        assert result["pain_point"] is not None
        assert 0 <= result["buying_intent_score"] <= 1

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")
    def test_debt_extraction(self, sample_texts):
        """Test extraction from debt-related text."""
        from ukmppr.llm_extraction import extract_from_text
        
        result = extract_from_text(sample_texts["debt"])
        assert result is not None
        assert result["ukpf_stage"] == "debt"


class TestExtractionAccuracy:
    """Evaluation harness for measuring extraction accuracy."""

    @pytest.fixture
    def labelled_test_set(self):
        """
        Gold-standard labelled test set for evaluation.
        Each entry has the text and expected extractions.
        """
        return [
            {
                "text": "I'm 25 with £40k saved. Should I overpay my mortgage or invest in a S&S ISA?",
                "expected": {
                    "ukpf_stage": "investing",
                    "intent_type": "seeking_advice",
                    "has_pain_point": True,
                    "buying_intent_min": 0.3,
                    "buying_intent_max": 0.7,
                }
            },
            {
                "text": "My credit score dropped from 999 to 800 after I missed one payment. How long to recover?",
                "expected": {
                    "ukpf_stage": "debt",
                    "intent_type": "seeking_advice",
                    "has_pain_point": True,
                    "buying_intent_min": 0.0,
                    "buying_intent_max": 0.3,
                }
            },
            {
                "text": "Just got promoted! My salary went from £35k to £55k. How should I adjust my pension contributions?",
                "expected": {
                    "ukpf_stage": "pension",
                    "intent_type": "seeking_advice",
                    "has_pain_point": False,
                    "buying_intent_min": 0.0,
                    "buying_intent_max": 0.5,
                }
            },
            {
                "text": "Has anyone used Chip or Plum for automatic savings? Looking for the best app to help me save.",
                "expected": {
                    "ukpf_stage": "budgeting",
                    "intent_type": "researching",
                    "has_pain_point": False,
                    "buying_intent_min": 0.4,
                    "buying_intent_max": 0.9,
                    "expected_products": ["Chip", "Plum"]
                }
            },
            {
                "text": "First time buyer here - is £350k realistic for a 2-bed in Manchester? Got £50k deposit and £70k salary.",
                "expected": {
                    "ukpf_stage": "mortgage",
                    "intent_type": "researching",
                    "has_pain_point": True,
                    "buying_intent_min": 0.5,
                    "buying_intent_max": 1.0,
                }
            },
            {
                "text": "Finally debt free after 3 years of StepChange! Here's my journey and tips for others struggling.",
                "expected": {
                    "ukpf_stage": "debt",
                    "intent_type": "sharing_experience",
                    "has_pain_point": False,
                    "buying_intent_min": 0.0,
                    "buying_intent_max": 0.2,
                    "expected_products": ["StepChange"]
                }
            },
            {
                "text": "I've got £10k sitting in my current account. Where should I put my emergency fund for best interest?",
                "expected": {
                    "ukpf_stage": "emergency_fund",
                    "intent_type": "seeking_advice",
                    "has_pain_point": False,
                    "buying_intent_min": 0.3,
                    "buying_intent_max": 0.8,
                }
            },
            {
                "text": "Moving to UK next month. Which bank should I open an account with? Need one that works for expats.",
                "expected": {
                    "ukpf_stage": "other",
                    "intent_type": "researching",
                    "has_pain_point": False,
                    "buying_intent_min": 0.5,
                    "buying_intent_max": 1.0,
                }
            },
        ]

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")
    def test_stage_classification_accuracy(self, labelled_test_set):
        """Measure UKPF stage classification accuracy."""
        from ukmppr.llm_extraction import extract_from_text
        
        correct = 0
        total = len(labelled_test_set)
        errors = []
        
        for item in labelled_test_set:
            result = extract_from_text(item["text"])
            if result and result["ukpf_stage"] == item["expected"]["ukpf_stage"]:
                correct += 1
            else:
                errors.append({
                    "text": item["text"][:50] + "...",
                    "expected": item["expected"]["ukpf_stage"],
                    "got": result["ukpf_stage"] if result else None
                })
        
        accuracy = correct / total
        print(f"\nStage Classification Accuracy: {accuracy:.1%} ({correct}/{total})")
        for error in errors:
            print(f"  - Expected '{error['expected']}', got '{error['got']}': {error['text']}")
        
        # Expect at least 70% accuracy
        assert accuracy >= 0.7, f"Stage accuracy too low: {accuracy:.1%}"

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")
    def test_intent_classification_accuracy(self, labelled_test_set):
        """Measure intent type classification accuracy."""
        from ukmppr.llm_extraction import extract_from_text
        
        correct = 0
        total = len(labelled_test_set)
        
        for item in labelled_test_set:
            result = extract_from_text(item["text"])
            if result and result["intent_type"] == item["expected"]["intent_type"]:
                correct += 1
        
        accuracy = correct / total
        print(f"\nIntent Classification Accuracy: {accuracy:.1%} ({correct}/{total})")
        
        # Expect at least 60% accuracy (intent is harder)
        assert accuracy >= 0.6, f"Intent accuracy too low: {accuracy:.1%}"

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")  
    def test_buying_intent_score_range(self, labelled_test_set):
        """Verify buying intent scores fall within expected ranges."""
        from ukmppr.llm_extraction import extract_from_text
        
        in_range = 0
        total = len(labelled_test_set)
        
        for item in labelled_test_set:
            result = extract_from_text(item["text"])
            if result:
                score = result["buying_intent_score"]
                min_score = item["expected"]["buying_intent_min"]
                max_score = item["expected"]["buying_intent_max"]
                if min_score <= score <= max_score:
                    in_range += 1
        
        accuracy = in_range / total
        print(f"\nBuying Intent in Range: {accuracy:.1%} ({in_range}/{total})")
        
        # Expect at least 50% in range (scoring is subjective)
        assert accuracy >= 0.5, f"Buying intent accuracy too low: {accuracy:.1%}"


class TestProductExtraction:
    """Tests for product/service name extraction."""

    @pytest.fixture
    def product_texts(self):
        """Texts with known product mentions."""
        return [
            ("Has anyone used Monzo's Plus account? Worth the £5/month?", ["Monzo"]),
            ("Comparing Chase vs Starling for my current account", ["Chase", "Starling"]),
            ("I use YNAB for budgeting and it's been life-changing", ["YNAB"]),
            ("Thinking about switching from Vanguard to InvestEngine", ["Vanguard", "InvestEngine"]),
            ("Got my mortgage through Halifax, decent rates", ["Halifax"]),
        ]

    @pytest.mark.skipif(True, reason="Requires Ollama to be running")
    def test_product_extraction(self, product_texts):
        """Test that products are correctly extracted."""
        from ukmppr.llm_extraction import extract_from_text
        
        recall_scores = []
        
        for text, expected_products in product_texts:
            result = extract_from_text(text)
            if result and result["products_mentioned"]:
                extracted = [p.lower() for p in result["products_mentioned"]]
                expected = [p.lower() for p in expected_products]
                
                # Calculate recall (how many expected products were found)
                found = sum(1 for p in expected if any(p in e for e in extracted))
                recall = found / len(expected)
                recall_scores.append(recall)
        
        avg_recall = sum(recall_scores) / len(recall_scores) if recall_scores else 0
        print(f"\nProduct Extraction Recall: {avg_recall:.1%}")
        
        # Expect at least 60% recall on products
        assert avg_recall >= 0.6, f"Product recall too low: {avg_recall:.1%}"
