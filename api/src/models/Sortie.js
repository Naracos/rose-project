const mongoose = require('mongoose');

const SortieSchema = new mongoose.Schema({
  messageId: { type: String, index: true, required: false },
  threadId: { type: String, required: false },
  channelId: { type: String, required: false },
  channelName: { type: String, required: false },
  guildId: { type: String, required: false },
  organizerId: { type: String, required: false },
  title: { type: String, required: false },
  participants: { type: [String], default: [] },
  feedbacks: { type: Array, default: [] },
  saved: { type: Boolean, default: false },
  savedAt: { type: Date, required: false },
  meta: { type: Object, required: false },

  // IDs du MP organisateur
  organizerDmMessageId: { type: String, required: false },
  organizerDmChannelId: { type: String, required: false },

  // IDs du tableau dans le thread
  tableMessageId: { type: String, required: false },
  tableChannelId: { type: String, required: false },

  // URL de la sortie (pour lien dynamique)
  sortieUrl: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.models.Sortie || mongoose.model('Sortie', SortieSchema);
