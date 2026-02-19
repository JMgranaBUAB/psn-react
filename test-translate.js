import translatePkg from 'translate-google-api';
const translate = translatePkg.default || translatePkg;

const testTranslation = async () => {
    try {
        console.log("Testing translation to Spanish...");
        const texts = ["Collect all trophies", "Complete the story mode"];
        const result = await translate(texts, { to: 'es' });
        console.log("Original:", texts);
        console.log("Translated:", result);

        if (Array.isArray(result) && result.length === 2 && result[0].toLowerCase().includes('trofeos')) {
            console.log("✅ Translation works correctly!");
        } else {
            console.log("❌ Translation result format or content unexpected.");
        }
    } catch (error) {
        console.error("❌ Translation error:", error.message);
    }
};

testTranslation();
