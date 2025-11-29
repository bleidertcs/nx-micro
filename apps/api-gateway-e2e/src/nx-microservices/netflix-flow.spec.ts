import axios from 'axios';

describe('Netflix Flow E2E', () => {
    const gatewayUrl = `http://localhost:3000/api`;
    const showTitle = `Test Show ${Date.now()}`;

    it('should create a show in netflix and retrieve it', async () => {
        // Step 1: Create a show via netflix service exposed by gateway
        const createResponse = await axios.post(
            `${gatewayUrl}/services/netflix/netflix`,
            {
                show_id: `s${Date.now()}`,
                title: showTitle,
                description: 'A test show description',
                release_year: 2024,
                country: 'US',
                duration: '1h',
                type: 'Movie'
            }
        );

        expect(createResponse.status).toBe(201);
        expect(createResponse.data).toBeDefined();
        expect(createResponse.data.title).toBe(showTitle);

        // A small delay to ensure data is propagated
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 2: Retrieve all shows
        const findResponse = await axios.get(
            `${gatewayUrl}/services/netflix/netflix`
        );

        expect(findResponse.status).toBe(200);
        expect(findResponse.data).toBeDefined();
        expect(Array.isArray(findResponse.data.data)).toBeTruthy();

        const createdShow = findResponse.data.data.find((s: any) => s.title === showTitle);
        expect(createdShow).toBeDefined();
    });
});
