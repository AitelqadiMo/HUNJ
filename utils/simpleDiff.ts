// A simple word-diff utility
export type DiffPart = {
    value: string;
    added?: boolean;
    removed?: boolean;
};

export const computeDiff = (oldText: string, newText: string): DiffPart[] => {
    if (!oldText) oldText = "";
    if (!newText) newText = "";

    // Optimization: If identical, return immediately
    if (oldText === newText) return [{ value: oldText }];

    // Split into tokens (words and punctuation) for finer diff
    // Using a regex that keeps delimiters
    const splitRegex = /([\s\S]+?)([\s.,;!?]+|$)/g;
    const tokenize = (text: string) => {
        const tokens = [];
        let match;
        while ((match = splitRegex.exec(text)) !== null) {
             if(match[0]) tokens.push(match[0]);
        }
        if (tokens.length === 0 && text.length > 0) return [text];
        return tokens;
    };

    const oldTokens = tokenize(oldText);
    const newTokens = tokenize(newText);
    
    // Very simplified "diff" to avoid heavy LCS computation on the client for large texts
    // This finds a common prefix and suffix to highlight the changed middle block.
    
    let prefixCount = 0;
    while(
        prefixCount < oldTokens.length && 
        prefixCount < newTokens.length && 
        oldTokens[prefixCount] === newTokens[prefixCount]
    ) {
        prefixCount++;
    }

    let suffixCount = 0;
    while(
        suffixCount < (oldTokens.length - prefixCount) && 
        suffixCount < (newTokens.length - prefixCount) && 
        oldTokens[oldTokens.length - 1 - suffixCount] === newTokens[newTokens.length - 1 - suffixCount]
    ) {
        suffixCount++;
    }

    const prefix = oldTokens.slice(0, prefixCount).join('');
    const removedTokens = oldTokens.slice(prefixCount, oldTokens.length - suffixCount);
    const addedTokens = newTokens.slice(prefixCount, newTokens.length - suffixCount);
    const suffix = oldTokens.slice(oldTokens.length - suffixCount).join('');

    const parts: DiffPart[] = [];
    if(prefix) parts.push({ value: prefix });
    if(removedTokens.length > 0) parts.push({ value: removedTokens.join(''), removed: true });
    if(addedTokens.length > 0) parts.push({ value: addedTokens.join(''), added: true });
    if(suffix) parts.push({ value: suffix });

    return parts;
};