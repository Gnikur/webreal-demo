const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

app.get('/api/test', (req, res) => {
    res.json(
        {
            message: "Backend is running",
            timestamp: new Date().toISOString()
        }
    );
});

app.post('/api/workflow/save', (req, res) => {
    const { nodes, connections } = req.body;
    console.log('Saving workflow:', {
        nodeCount:nodes?.length || 0,
        connectionCount: connections?.length || 0
    });

    res.json({
        success: true,
        message: 'Workflow saved successfully',
        data: {nodes, connections}
    });
});

app.post('/api/workflow/execute', (req, res) => {
    const {nodes, connections} = req.body;
    console. log('Executing workflow');

    let result = 0;
    nodes.forEach(node => {
        if (node.type === 'input'){
            result += node.value || 0;
        }
    });

    res.json({ 
    success: true, 
    message: 'Workflow executed',
    result: result
  });
})

app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}')
})