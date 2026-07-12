const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers["hdi-api-key"];

    if (!apiKey || apiKey !== process.env.HDI_API_KEY) {
        return res.status(401).json({
            status: "error",
            message: "Invalid API key"
        });
    }

    next();
};

module.exports = apiKeyAuth;