export const updateUserDateService = async (recordId, data, url) => {
    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
        });

        const responseData = await response.json().catch(() => null);
        
        return {
            status: response.status,
            data: responseData
        };
        
    } catch (error) {
        throw new Error(`Update failed: ${error.message}`);
    }
};