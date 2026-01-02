# Atencio AI Knowledge Base

## Overview

This directory contains the knowledge base for the Atencio AI assistant that helps business owners on the atencio.app marketing site.

## File: `atencioKnowledge.json`

This JSON file is the **single source of truth** for all information the AI assistant knows about Atencio.

### To Update the AI Assistant's Knowledge:

1. **Edit `src/ai/atencioKnowledge.json`**
   - Open the file in any text editor
   - Update the JSON content (pricing, FAQs, features, etc.)
   - Ensure the JSON syntax is valid (watch for commas, quotes, brackets)

2. **Deploy Changes**
   - Commit and push changes to GitHub
   - Railway will automatically redeploy
   - Changes take effect after deployment completes

### What Can Be Updated:

- **Brand Information**: Name, tagline, description, value proposition
- **Target Audience**: Who Atencio is for
- **Product Description**: What Atencio does
- **Key Benefits**: Features and benefits (array)
- **Pricing**: Plans, pricing notes, free trial info
- **Onboarding Steps**: Setup process steps
- **FAQs**: Frequently asked questions and answers
- **AI Tone**: Personality and communication guidelines

### JSON Structure:

```json
{
  "brand": {
    "name": "Atencio",
    "tagline": "...",
    "description": "...",
    "valueProposition": "..."
  },
  "whoItsFor": "...",
  "whatItDoes": "...",
  "keyBenefits": [
    {
      "title": "...",
      "description": "..."
    }
  ],
  "pricing": {
    "freeTrial": "...",
    "plans": [],
    "pricingNotes": "..."
  },
  "onboardingSteps": [...],
  "faqs": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "aiTone": {
    "personality": "...",
    "guidelines": [...]
  }
}
```

### Adding Pricing Plans:

To add pricing plans, edit the `pricing.plans` array:

```json
"pricing": {
  "plans": [
    {
      "plan": "Free",
      "price": "$0/month",
      "description": "Perfect for getting started",
      "features": [
        "Unlimited bookings",
        "AI assistant",
        "Email confirmations"
      ]
    },
    {
      "plan": "Pro",
      "price": "$29/month",
      "description": "For growing businesses",
      "features": [
        "Everything in Free, plus:",
        "Unlimited services",
        "Advanced analytics"
      ]
    }
  ]
}
```

### Adding FAQs:

To add or update FAQs, edit the `faqs` array:

```json
"faqs": [
  {
    "question": "Your question here?",
    "answer": "Your answer here."
  }
]
```

### Important Notes:

- **JSON Syntax**: Ensure proper JSON formatting (commas, quotes, brackets)
- **Validation**: Test JSON syntax before deploying (use a JSON validator if unsure)
- **Deployment**: Changes require deployment to take effect
- **No Hallucination**: The AI will only use information from this file - it won't make up answers

### Testing Changes:

1. Make edits to `atencioKnowledge.json`
2. Deploy to Railway
3. Test by asking the AI assistant on atencio.app
4. Verify the AI uses your updated information

---

**Last Updated**: See git history for change tracking

