const { Events } = require('discord.js');
const logAction = require('../utils/actionLogger');

module.exports = {
    name: Events.Debug,
    execute(info) {
        if (info.includes('reaction') || info.includes('MESSAGE')) {
            console.log('DEBUG:', info);
        }
    }
};