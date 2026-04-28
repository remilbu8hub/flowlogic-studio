# FlowLogic Studio

FlowLogic Studio is an interactive supply chain design sandbox for exploring flow, cost, risk, and response time.

It is built for two primary use cases:

- learning and teaching supply chain design concepts
- lightweight decision support for structure and tradeoff discussions

## What It Helps Users Explore

- push/pull boundary behavior across the actual network graph
- transport tradeoffs across truck, air, and ship lanes
- inventory posture and where stock is held
- cost accumulation across nodes and lanes
- variability, structural risk, and disruption response

## What It Is Not

FlowLogic Studio is not:

- an ERP system
- a production planning system
- a formal optimizer
- a full digital twin

## Modes

The app supports:

- Educator mode
- Business mode

Both modes use the same simulation engine. The difference is in framing, control visibility, and the amount of detail shown.

## Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

FlowLogic Studio is a Vite + React app deployed on Vercel.

- frontend builds are produced with `npm run build`
- support form submissions are handled by the Vercel serverless endpoint at `/api/feedback`
- GitHub Pages is not used for deployment

## Support

Support options currently include:

- an in-app feedback form backed by the Vercel `/api/feedback` endpoint
- a prefilled GitHub issue flow targeting the project repository
