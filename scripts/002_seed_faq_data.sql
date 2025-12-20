-- Create FAQ knowledge base table
CREATE TABLE IF NOT EXISTS faq_knowledge (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed FAQ data for the fictional e-commerce store
INSERT INTO faq_knowledge (id, category, question, answer) VALUES
  ('faq-1', 'shipping', 'What is your shipping policy?', 'We offer free standard shipping on all orders over $50. Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available for $9.99.'),
  ('faq-2', 'shipping', 'Do you ship internationally?', 'Yes, we ship to over 100 countries worldwide. International shipping costs vary by destination and typically takes 10-15 business days.'),
  ('faq-3', 'returns', 'What is your return policy?', 'We accept returns within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5-7 business days after we receive your return.'),
  ('faq-4', 'returns', 'How do I initiate a return?', 'To start a return, email us at returns@example.com with your order number. We will send you a prepaid return label within 24 hours.'),
  ('faq-5', 'support', 'What are your support hours?', 'Our customer support team is available Monday-Friday, 9 AM - 6 PM EST. We also offer 24/7 email support at support@example.com.'),
  ('faq-6', 'payment', 'What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.'),
  ('faq-7', 'products', 'Do you offer product warranties?', 'Yes, all our products come with a 1-year manufacturer warranty. Extended warranties are available for purchase at checkout.');
