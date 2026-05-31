import fs from 'fs';

const rawContent = fs.readFileSync('scripts/tools-eleven-agent.json', 'utf8');

// Extract all valid JSON blocks from the string
const tools = [];

// Using regex to find the JSON objects. Since there might be markdown or backticks,
// and some start with just `{`, we'll split by `### Tool` to get each section.
const sections = rawContent.split('### Tool').slice(1);

for (const section of sections) {
    // Find the first `{` and the last `}`
    const startObj = section.indexOf('{');
    const endObj = section.lastIndexOf('}');
    
    if (startObj !== -1 && endObj !== -1) {
        const jsonStr = section.substring(startObj, endObj + 1);
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.name) {
                tools.push(parsed);
            }
        } catch(e) {
            console.error("Failed to parse section: ", e.message);
        }
    }
}

console.log(`Encontrei ${tools.length} ferramentas.`);

const geminiTools = tools.map(t => {
    const props = {};
    const req = [];

    if (t.parameters && Array.isArray(t.parameters)) {
        t.parameters.forEach(p => {
            props[p.name] = {
                type: p.type === 'number' ? 'integer' : p.type, // Map number to integer for Gemini compatibility commonly used
                description: p.description
            };
            if (p.required) {
                req.push(p.name);
            }
        });
    }

    const funcDecl = {
        name: t.name,
        description: t.description
    };
    
    if (Object.keys(props).length > 0) {
        funcDecl.parameters = {
            type: "object",
            properties: props
        };
        if (req.length > 0) {
            funcDecl.parameters.required = req;
        }
    }

    return funcDecl;
});

fs.writeFileSync('src/lib/gemini-voice-tools.json', JSON.stringify(geminiTools, null, 2));

console.log(`Gerado src/lib/gemini-voice-tools.json com ${geminiTools.length} ferramentas.`);
