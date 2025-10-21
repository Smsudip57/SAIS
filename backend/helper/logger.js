const isDevelopment = process.env.NODE_ENV === 'development';
const log = {

    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    error: (...args) => {
        if (isDevelopment) {
            console.error(...args);
        }
    },

    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
};

module.exports = log;
