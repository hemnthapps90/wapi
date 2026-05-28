-- Table to store uploaded Campaigns/Files
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    message_template TEXT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store individual contacts from the uploaded CSV and their delivery status
CREATE TABLE campaign_messages (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    saved_name VARCHAR(100),
    personalized_message TEXT,
    delivery_status ENUM('queued', 'sent', 'failed') DEFAULT 'queued',
    error_log TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster querying
CREATE INDEX idx_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX idx_phone_number ON campaign_messages(phone_number);