const fs = require('fs');
const path = require('path');

class MessageQueue {
    constructor(maxRetries = 5, retryDelay = 3000) {
        this.queue = [];
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.queueFile = path.join(__dirname, '../data/message-queue.json');
        this.isConnected = false;
        this.loadFromFile();
    }

    loadFromFile() {
        try {
            if (fs.existsSync(this.queueFile)) {
                const data = fs.readFileSync(this.queueFile, 'utf8');
                this.queue = JSON.parse(data);
                console.log(`📨 Loaded ${this.queue.length} queued messages from disk`);
            }
        } catch (err) {
            console.log('⚠️ Error loading message queue:', err.message);
            this.queue = [];
        }
    }

    saveToFile() {
        try {
            const dir = path.dirname(this.queueFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.queueFile, JSON.stringify(this.queue, null, 2));
        } catch (err) {
            console.error('❌ Error saving message queue:', err.message);
        }
    }

    addMessage(chatId, message, priority = 0) {
        const queueItem = {
            id: `${chatId}-${Date.now()}`,
            chatId,
            message,
            priority,
            retries: 0,
            createdAt: new Date().toISOString(),
            lastAttempt: null
        };
        
        this.queue.push(queueItem);
        this.queue.sort((a, b) => b.priority - a.priority);
        this.saveToFile();
        console.log(`📤 Message queued for ${chatId} (${this.queue.length} in queue)`);
        return queueItem.id;
    }

    async processQueue(socket) {
        if (!this.isConnected || this.queue.length === 0) {
            return;
        }

        const processableMessages = [...this.queue].slice(0, 5);
        
        for (const item of processableMessages) {
            try {
                await socket.sendMessage(item.chatId, item.message);
                this.removeMessage(item.id);
                console.log(`✅ Sent queued message to ${item.chatId}`);
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                item.retries++;
                item.lastAttempt = new Date().toISOString();
                
                if (item.retries > this.maxRetries) {
                    console.log(`❌ Message ${item.id} failed after ${this.maxRetries} retries`);
                    this.removeMessage(item.id);
                } else {
                    console.log(`⚠️ Retry ${item.retries}/${this.maxRetries} for ${item.chatId}`);
                }
                this.saveToFile();
            }
        }
    }

    removeMessage(messageId) {
        const index = this.queue.findIndex(m => m.id === messageId);
        if (index > -1) {
            this.queue.splice(index, 1);
            this.saveToFile();
        }
    }

    clearQueue() {
        this.queue = [];
        this.saveToFile();
    }

    getQueueSize() {
        return this.queue.length;
    }

    setConnected(isConnected) {
        this.isConnected = isConnected;
    }
}

module.exports = MessageQueue;
