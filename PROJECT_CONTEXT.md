# Supply Chain Simulator - Project Context

## Purpose

This project is an interactive, browser-based supply chain structure simulator.

Its job is to help users explore supply chain design and operating tradeoffs through a visual, explainable sandbox.

Priority:

`Clarity and insight > realism and completeness`

This product is not intended to become:

- An ERP system
- A production planning tool
- A mathematically optimal solver
- A digital twin

The product currently serves two audiences:

- Educators and students who need a fast teaching sandbox
- Business users who need lightweight decision support and scenario comparison

## Current Product Shape

The app has three top-level views:

- `simulator`
- `about`
- `support`

The simulator is the main product surface.

The app also supports two product modes:

- `educator`
- `business`

Those modes share the same simulation engine and graph model, but they change framing and visibility:

- Educator mode emphasizes coaching and simpler controls
- Business mode emphasizes decision support and detailed cost visibility

Mode configuration lives in:

- `src/config/appModes.js`

Global mode state lives in:

- `src/state/appModeContext.jsx`

## Core Mental Model

The simulator models a supply chain as a graph of stateful nodes connected by directed lanes.

Node types:

- Supplier
- Factory
- Distribution Center (DC)
- Retail
- Customer

Connections represent:

- Material flow downstream
- Orders upstream

Each node is independent and owns its own local state.

Each node manages:

- On-hand inventory
- Incoming pipeline inventory
- Orders placed upstream
- Shipments sent downstream

Customer nodes generate demand only.

## Simulation Model

The simulation engine remains centered in:

- `src/sim/engine.js`

The engine should be treated as stable unless a clear bug requires a focused fix.

The simulator runs in discrete time steps (ticks).

Preferred tick order:

1. Customer demand is generated
2. Retailers attempt fulfillment
3. Stockouts are recorded as lost sales
4. Orders propagate upstream
5. Nodes compute replenishment decisions
6. Shipments advance along edges according to lead times
7. Inventory updates
8. Metrics update

The simulation should remain explicit and traceable. Avoid hidden side effects and opaque control flow.

## Inventory Rules

- Inventory is local to each node
- Pipeline inventory must be tracked separately
- No global inventory pooling
- No implicit teleportation of goods
- Lost sales model only, with no backorders

## Replenishment Logic

Current logic should remain simple and intentional, such as base-stock or reorder-point style behavior.

Do not introduce unless explicitly requested:

- Complex forecasting systems
- Optimization solvers
- Multi-echelon optimization logic
- Smart or opaque replenishment behavior

## Push / Pull Boundary

The push/pull boundary is now graph-aware, not type-order-aware.

Important implementation rules:

- Node modes are assigned from graph depth, not from x-position
- Suppliers are depth `0`
- Depths are computed by BFS over the directed graph
- If multiple paths exist, the minimum depth wins
- Nodes with depth `<= boundaryColumn` become `push`
- Nodes with depth `> boundaryColumn` become `pull`
- Customers are always forced to `pull`

Shared helpers live in:

- `src/sim/graphHelpers.js`

Key helpers:

- `computeNodeDepths(nodes, edges)`
- `applyBoundaryModesToNodes(nodes, edges, boundaryColumn)`

Visual boundary behavior:

- The line in the graph is based on actual node positions, not a fixed grid column
- The visual line sits between the rightmost push nodes and the leftmost pull nodes
- If necessary, it falls back to a reasonable offset or the old grid midpoint
- The line can be segmented to avoid crossing lane label rectangles

Important separation of concerns:

- Visual boundary follows node modes and node positions
- Node modes do not follow x-position

Retail warning behavior:

- If a retail node is upstream of the push/pull threshold, `node.flags.upstreamRetail` is set
- Coaching and learning content may surface that warning

## Transport Model

Lanes now support transport metadata.

Each edge can carry:

- `transportType`
- `costMultiplier`
- `leadTimeMultiplier`
- `riskMultiplier`
- `isOutsourced`

Supported transport types:

- `truck`
- `air`
- `ship`

Transport config lives in:

- `src/config/transportTypes.js`

Theme transport colors live in:

- `src/config/theme.js`

Transport behavior rules:

- Truck = moderate baseline
- Air = expensive and fast
- Ship = cheaper and slower

The simulation engine is still not transport-aware internally. Transport effects are applied before or after the engine in lightweight helpers.

Pre-engine transport transformation:

- `src/sim/applyTransportEffects.js`

This helper derives:

- `effectiveL`
- `effectiveSigma`
- `effectiveCost`

App-level simulation flow:

1. Build effective scenario
2. Apply transport effects to edges
3. Pass transformed lead time / variability values into `runSimulation(...)`
4. Apply lane transport cost post-processing to results

## Lane Geography Rules

Transport defaults and validation are location-aware.

Geography helper lives in:

- `src/sim/laneGeography.js`

Intent:

- Same region or simplified nearby land moves can default to `truck`
- Obvious ocean-crossing / intercontinental moves should not default to `truck`
- `air` remains selectable as a premium fast option
- `ship` is the default long-distance/ocean-crossing baseline

Important examples:

- North America ↔ North America: truck-valid
- Latin America ↔ North America: truck-valid as a simplified regional case
- East Asia / South Asia / Southeast Asia ↔ North America: truck-invalid
- Europe ↔ North America: truck-invalid

When loading old/sample scenarios or editing nodes:

- Impossible truck lanes are auto-normalized to the geography-based default
- Missing locations should not crash the app

Lane editor behavior:

- `air` allowed for all lanes
- `ship` allowed for intercontinental lanes
- `truck` only allowed when geography permits it

## 3PL / Outsourcing

Lanes may be marked with:

- `isOutsourced: true`

This is no longer cosmetic.

Lane cost proxy logic applies an outsourcing multiplier:

- Internal lane multiplier = `1.0`
- Outsourced / 3PL multiplier = `0.72`

This multiplier is applied after transport cost logic so transport relationships remain intact.

Current lane cost detail output includes outsourcing context.

## Cost Model

The engine still owns node inventory-driven cost logic.

The app adds a lightweight lane transport cost layer outside the engine.

Lane cost post-processing lives in:

- `src/sim/applyLaneTransportCost.js`

Important rule:

- Do not rewrite engine cost math casually
- Preserve existing inventory-driven cost fields
- Add lane transport cost as a separate, additive layer

Current result extensions include fields such as:

- `totalLaneTransportCost`
- `totalSupplyChainCostBeforeLaneTransport`
- `totalSupplyChainCostWithLaneTransport`
- `laneTransportCostModel`
- `laneTransportCostDetails`

Important honesty rule:

- Lane transport cost is currently a proxy model, not a full logistics cost system
- Missing lane cost should be labeled honestly as proxy/pending rather than presented as precise

## Cost Accumulation View

The canvas workspace has two view modes:

- `graph`
- `cost`

This toggle lives inside the graph workspace header, not outside the canvas.

The graph shell remains the outer container for both views.

Cost accumulation view component:

- `src/components/CostAccumulationView.jsx`

Current view expectations:

- Uses plain SVG, not a chart library
- Shows a cumulative cost path
- Distinguishes node costs from lane costs
- Preserves honest proxy labeling for lane costs
- Includes legend, y-axis/grid context, and emphasized final total
- Fills the available canvas area responsively

Current line style:

- Diagonal/polyline accumulation line by default

## UI Model

The UI supports:

- Drag-and-drop node repositioning
- Click-to-edit node and lane content
- Auto layout
- Explicit lane selection and node selection
- Graph view and cost view in the same workspace shell
- Scenario loading and saving
- Learning/coaching overlays
- Disruption cards

The UI should remain:

- Fast
- Intuitive
- Uncluttered
- Visual-first

## Graph Canvas Rules

Primary component:

- `src/components/GraphCanvas.jsx`

Important current behavior:

- Graph and cost view toggle lives inside the workspace header
- Resize handle must be preserved
- Lane double-click opens lane editor
- Node double-click opens node editor
- Boundary line updates as nodes move or boundary settings change

Current spacing/layout notes:

- Stage spacing is intentionally wider than the original baseline to make lane labels readable
- Horizontal layout constants currently use wider stage gaps in graph helpers
- Boundary line can skip around lane label rectangles to avoid readability problems

## Node Card Rules

Node cards should show:

- Node name
- Node type
- Location
- Stock type/form
- Sourcing posture where relevant
- Risk badge when available

Node cards should not show:

- `Mode: push`
- `Mode: pull`

Stock type icon system:

- `components`
- `generic`
- `configured`
- `finished`
- `packed`

Current stock icons use `lucide-react`.

Sourcing posture visibility rule:

- Show only for Supplier, Factory, and DC
- Do not show for Retail or Customer

## Stock Form Rules

Supported stock forms now include:

- `components`
- `generic`
- `configured`
- `finished`
- `packed`

Supplier defaults:

- New suppliers should default to `components` when reasonable

Future rule preparation:

- Supplier-held component inventory is intended to be treated as embedded in supplier pricing rather than user-facing inventory-driven cost
- This is only a preparation note for now and is not yet a full engine rule change

## Scenario System

Scenario source:

- `src/data/sampleScenarios.js`

Scenarios now include richer metadata such as:

- `title`
- `shortDescription`
- `intendedMode`
- `learningPurpose`
- `businessPurpose`

Mode-specific intent:

- Educator mode should prioritize educator-oriented scenarios
- Business mode should prioritize business-oriented scenarios
- Scenarios should not be permanently hidden; sorting/prioritization is preferred

Notable scenario coverage now includes:

- Push/pull boundary lab
- Transport tradeoff lab
- Business resilience/cost tradeoff scenario

## Learning and Coaching

Learning modal:

- `src/components/LearningModal.jsx`

Coaching / insight panel:

- `src/components/InsightPanel.jsx`

Current coaching content should be aware of:

- Expensive air lanes
- Slow ship lanes
- High-variance lanes
- 3PL cost reduction behavior
- Upstream retail warning flags
- Large jumps in cost accumulation when available

Current learning content should cover:

- Structure-aware push/pull boundary
- Transport tradeoffs
- 3PL outsourcing
- Cost accumulation view

Copy rule:

- Do not expose internal version language such as `V2`, `version 2`, or `new feature`
- User-facing copy should read like one coherent finished product

## App Navigation and Product Pages

Header component:

- `src/components/DashboardHeader.jsx`

Current structure:

- Top bar with mode badge, nav, and actions
- Title/subtitle block below

Top-level views:

- Simulator
- About
- Support

Current product pages:

- `src/components/AboutPage.jsx`
- `src/components/SupportPage.jsx`

About page should explain:

- What the tool does
- Who it is for
- What it models
- What it is not
- How to use it

Support page should be real, not placeholder.

Current support workflows:

- Feedback POST to `/api/feedback`
- Prefilled GitHub issue URL

Current serverless support endpoint:

- `api/feedback.js`

Current GitHub issue integration:

- Opens `https://github.com/remilbu8hub/UWYO-Supply-Chain-Simulation/issues/new?...`

Prefilled body should include context such as:

- User message
- Scenario/workspace name
- Current mode
- Node count
- Edge count
- Boundary setting

## Save / Rename Workflows

Save scenario workflow:

- Save controls live in the header, not in the left control panel
- Save button opens an in-app modal
- Saving still goes through existing leaderboard storage logic

Rename workspace workflow:

- Workspace title is user-editable
- Rename uses an in-app modal, not `window.prompt`
- Empty save falls back to `Supply Chain Workspace`

Relevant components:

- `src/components/SaveScenarioModal.jsx`
- `src/components/RenameWorkspaceModal.jsx`

## Theme System

Theme source:

- `src/config/theme.js`

Current visual direction:

- Professional Neutral palette
- Slightly darker app background
- Green truck lanes
- Red air lanes
- Blue ship lanes

Use theme tokens where practical instead of scattering hardcoded colors.

Important tokens include:

- `background`
- `surface`
- `primary`
- `secondary`
- `textPrimary`
- `textMuted`
- `border`
- `success`
- `warning`
- `danger`
- `transport.*`

## Disruptions

Disruption cards are active in the simulator.

Relevant files:

- `src/data/disruptionCards.js`
- `src/components/DisruptionDeck.jsx`
- `src/components/ActiveDisruptionBanner.jsx`

Important constraint:

- Disruptions should remain visible, scenario-like, and interpretable
- Avoid turning them into a hidden complex stochastic system

## Metrics

Core metrics should stay transparent, easy to compute, and easy to visualize.

Current and intended metrics include:

- Service level / fill rate
- Stockouts / lost sales
- Inventory levels
- Throughput
- Total supply chain cost
- Aggregate risk
- Cost accumulation
- Bullwhip effect as an optional derived metric

## Non-Negotiable Design Decisions

- Lost sales model with no backorders
- Single-product system
- Deterministic core unless randomness is explicitly enabled
- Node-level autonomy
- Local logic over global magic
- Shared simulation engine for educator and business modes

## Design Philosophy

### 1. Do Not Overengineer

Avoid:

- Deep inheritance trees
- Abstract frameworks
- Unnecessary configuration layers
- Over-generalization

Prefer:

- Simple, explicit logic
- Readable code
- Direct data flow

### 2. Preserve Mental Model Clarity

A user should always be able to answer:

- Where is inventory?
- What is moving?
- Why did this happen?

If a feature makes those questions harder to answer, it is a bad fit unless there is an explicit reason to accept the tradeoff.

### 3. Local Logic Over Global Magic

Each node should:

- Own its state
- Make its own decisions

Avoid centralized god-logic that obscures behavior.

### 4. Visual-First Thinking

This is a learning tool, not just a simulator engine.

For any meaningful feature or behavior change, ask:

- Can the user see the effect?
- Is the behavior intuitive?
- Does the interface teach what is happening?

### 5. Fast Iteration

- Keep the system lightweight
- Avoid heavy computation
- Prioritize responsiveness
- Favor straightforward implementation over abstract flexibility

## Coding Guidelines

- Preserve existing behavior unless explicitly asked to change it
- Extend the current structure rather than redesigning it casually
- Keep implementations simple and readable
- Prefer modular, node-based logic
- Maintain an explicit simulation loop
- Avoid hidden side effects

Ideal node responsibilities include behavior such as:

- `update()`
- `placeOrders()`
- `receiveShipment()`
- `fulfillDemand()`

These are conceptual guideposts and should support clarity rather than force a premature architecture rewrite.

## Failure Modes To Avoid

Do not:

- Turn the simulator into a digital twin
- Add unnecessary abstraction
- Introduce multi-product complexity
- Add deep financial modeling unless requested
- Replace simple logic with smart but opaque logic
- Optimize for realism at the expense of teaching clarity
- Hide proxy models behind fake precision

## Known Current Implementation Notes

These are useful to remember after context loss:

- `src/App.jsx` currently contains a duplicated simulator render path plus a `simulatorView` constant that appears to be dead/duplicated UI structure
- The app still builds and works, but `App.jsx` deserves a cleanup/deduplication pass later
- Some visible text in parts of the app may still have encoding/mojibake artifacts from earlier phases
- Node stage fill colors in the graph are still more semantic than fully theme-tokenized

These are cleanup items, not active engine bugs.

## Default Decision Rule

When unsure, prefer:

`What would make this easier to understand and visualize?`

Do not default to:

`What would make this more realistic or complete?`

## Working Rule For Future Changes

When modifying or adding features:

1. Preserve existing behavior unless explicitly told otherwise
2. Keep implementations simple and readable
3. Align with the educational and decision-support purpose of the simulator
4. Avoid introducing complexity without a clear reason
5. Keep user-facing copy product-neutral and polished

## Intended End State

The simulator should feel like a fast, intuitive sandbox where:

- Users can build supply chains in seconds
- Behavior is immediately visible
- Core supply chain principles emerge naturally
- Tradeoffs around cost, risk, response time, transport, and structure are easy to compare
- The tool feels approachable rather than academic or heavy

## Maintenance Note

This file is the durable project memory for ongoing work.

When chat context gets crowded, treat this file as the source of truth and update it deliberately as major design decisions, constraints, feature behaviors, or implementation caveats evolve.
