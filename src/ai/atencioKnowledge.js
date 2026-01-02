/**
 * Atencio Knowledge Base
 * 
 * This file contains all the information the Atencio AI assistant knows about.
 * Edit this file to update what the AI knows without changing AI logic.
 * 
 * Structure:
 * - company: Basic company information
 * - features: List of key features
 * - onboardingSteps: Steps for business owners to get started
 * - pricing: Pricing information (to be filled in by user)
 * - faq: Frequently asked questions
 */

module.exports = {
  company: {
    name: "Atencio",
    description: "Atencio is a booking platform with an AI customer service assistant designed specifically for local service businesses. It helps business owners manage bookings, automate customer service, and streamline their operations.",
    valueProposition: "Atencio combines easy online booking with an intelligent AI receptionist that answers customer questions 24/7, handles bookings, and sends confirmations automatically."
  },

  features: [
    {
      title: "Easy Online Booking",
      description: "Customers can book appointments directly through your personalized booking page. No phone calls needed."
    },
    {
      title: "AI Customer Service Assistant",
      description: "An intelligent AI assistant that answers customer questions 24/7, explains your services, helps with bookings, and provides instant support."
    },
    {
      title: "Automated Email Confirmations",
      description: "Automatic email confirmations sent to customers when they book, cancel, or when appointment status changes."
    },
    {
      title: "Personalized Booking Page",
      description: "Your own unique booking page link where customers can view your services, learn about your business, and book appointments."
    },
    {
      title: "Service Management",
      description: "Easily add, edit, and organize your services with pricing, descriptions, and duration."
    },
    {
      title: "Business Hours Management",
      description: "Set your availability so customers can only book during times you're available."
    },
    {
      title: "FAQ Management",
      description: "Create custom FAQs that help the AI assistant answer common customer questions accurately."
    },
    {
      title: "Private Customer Feedback",
      description: "Receive private feedback from customers after appointments to help improve your services."
    }
  ],

  onboardingSteps: [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up with your email address to get started. The process is quick and easy."
    },
    {
      step: 2,
      title: "Complete Your Business Profile",
      description: "Add your business name, description, contact information, and upload your business logo."
    },
    {
      step: 3,
      title: "Add Your Services",
      description: "Create at least one service with pricing, description, and duration. You can add multiple services and reorder them."
    },
    {
      step: 4,
      title: "Set Your Business Hours",
      description: "Define when you're available so customers can book appointments during your operating hours."
    },
    {
      step: 5,
      title: "Add FAQs (Optional but Recommended)",
      description: "Create frequently asked questions to help the AI assistant provide accurate answers to common customer questions. We recommend at least 3 FAQs."
    },
    {
      step: 6,
      title: "Share Your Booking Page",
      description: "Once setup is complete, share your unique booking page link with customers to start receiving bookings."
    }
  ],

  pricing: [
    // Pricing information will be added by the user
    // Structure example:
    // {
    //   plan: "Free",
    //   price: "$0/month",
    //   features: ["Feature 1", "Feature 2"]
    // }
  ],

  faq: [
    {
      question: "What is Atencio?",
      answer: "Atencio is a booking platform with an AI customer service assistant designed for local service businesses. It helps you manage online bookings, automate customer service, and streamline your operations with a personalized booking page and intelligent AI assistant."
    },
    {
      question: "How does the AI customer service work?",
      answer: "The AI assistant is available 24/7 on your booking page. It answers customer questions about your services, helps with bookings, explains your business hours, and provides instant support. You can train it by adding FAQs that help it answer questions accurately."
    },
    {
      question: "Do I need technical knowledge to use Atencio?",
      answer: "No technical knowledge is required. Atencio is designed for non-technical business owners. The setup process is simple and guided, and you can manage everything through an easy-to-use dashboard."
    },
    {
      question: "How do customers book appointments?",
      answer: "Customers visit your personalized booking page (you get a unique link), browse your services, ask the AI assistant questions, and book appointments directly online. They receive email confirmations automatically."
    },
    {
      question: "Can I customize my booking page?",
      answer: "Yes! You can add your business name, description, logo, services, business hours, and FAQs. Your booking page will reflect your brand and business information."
    },
    {
      question: "What information do I need to set up my account?",
      answer: "You'll need your business name, description, contact information (email, phone), and at least one service. You can also add business hours, FAQs, and other details to enhance your booking page."
    },
    {
      question: "Is there a mobile app?",
      answer: "Atencio works on any device with a web browser - desktop, tablet, or mobile. Your booking page is mobile-friendly, and you can manage everything from your phone or computer."
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for an account, complete your business profile, add your services, set your business hours, and optionally add FAQs. Once setup is complete, you can share your booking page link with customers to start receiving bookings."
    }
  ]
};

