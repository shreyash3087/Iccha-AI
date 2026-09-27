"use client";

import React, { useState } from "react";
import type { FAQItem } from "@/types/business";

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  faqs?: FAQItem[];
  primaryColor?: string;
  lang?: "hi" | "en";
}

const DEFAULT_FAQS_HI: FAQItem[] = [
  {
    id: "faq-1",
    question: "क्या होम डिलीवरी और पार्सल की सुविधा उपलब्ध है?",
    answer: "जी हाँ, हम आसपास के सभी क्षेत्रों में तेज़ और सुरक्षित होम डिलीवरी प्रदान करते हैं। आप सीधे WhatsApp या कॉल के ज़रिए ऑर्डर दे सकते हैं।",
  },
  {
    id: "faq-2",
    question: "दुकान के खुलने और बंद होने का समय क्या है?",
    answer: "हमारी दुकान सप्ताह के निर्धारित दिनों में सुबह से रात तक खुली रहती है। सटीक समय के लिए नीचे दिए गए संपर्क सेक्शन को देखें।",
  },
  {
    id: "faq-3",
    question: "भुगतान के कौन-कौन से माध्यम स्वीकार किए जाते हैं?",
    answer: "हम UPI (Google Pay, PhonePe, Paytm, BHIM), नकद (Cash) और सभी प्रमुख डेबिट/क्रेडिट कार्ड स्वीकार करते हैं।",
  },
  {
    id: "faq-4",
    question: "क्या पार्टी या बड़े कार्यक्रमों के लिए बल्क ऑर्डर स्वीकार किए जाते हैं?",
    answer: "जी हाँ, हम जन्मदिन, पारिवारिक कार्यक्रमों और ऑफिस पार्टियों के लिए विशेष कैटरिंग और बल्क पैक तैयार करते हैं। अग्रिम बुकिंग के लिए हमें कॉल करें।",
  },
];

const DEFAULT_FAQS_EN: FAQItem[] = [
  {
    id: "faq-1",
    question: "Do you offer home delivery and takeaway parcels?",
    answer: "Yes, we provide fast, secure takeaway parcels and local delivery. You can place an order directly via WhatsApp or phone call.",
  },
  {
    id: "faq-2",
    question: "What are your business operating hours?",
    answer: "Our business is open on scheduled days throughout the week. Please check the contact section below for exact opening and closing timings.",
  },
  {
    id: "faq-3",
    question: "Which payment methods are accepted?",
    answer: "We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Cash, and all major debit and credit cards.",
  },
  {
    id: "faq-4",
    question: "Can I place bulk orders or catering for special events?",
    answer: "Yes! We cater for birthdays, family gatherings, corporate events, and parties. Please contact us in advance to arrange a custom order.",
  },
];

export function FAQSection({
  title,
  subtitle,
  faqs = [],
  primaryColor = "#ea580c",
  lang = "hi",
}: FAQSectionProps) {
  const isEn = lang === "en";
  const displayTitle = title || (isEn ? "Frequently Asked Questions (FAQ)" : "अक्सर पूछे जाने वाले सवाल (FAQ)");
  const displaySubtitle = subtitle || (isEn ? "Helpful answers to common questions about orders & timings" : "दुकान, ऑर्डर और डिलीवरी से जुड़ी महत्वपूर्ण जानकारी");
  const defaultItems = isEn ? DEFAULT_FAQS_EN : DEFAULT_FAQS_HI;
  const items = faqs.length > 0 ? faqs : defaultItems;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section
      id="section-faq"
      className="py-16 sm:py-20 px-6 bg-[#0c0e14] border-b border-white/[0.06]"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-9">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white m-0 mb-2">
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p className="text-sm sm:text-base text-white/65 m-0">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.id || idx}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-200"
                style={isOpen ? { borderColor: `${primaryColor}55` } : undefined}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4.5 sm:p-5 flex justify-between items-center bg-transparent border-0 text-white text-sm sm:text-base font-bold text-left cursor-pointer gap-3.5"
                >
                  <span>{item.question}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`shrink-0 transition-transform duration-200 text-amber-400 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-white/75 leading-relaxed border-t border-white/[0.05] pt-3.5">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
