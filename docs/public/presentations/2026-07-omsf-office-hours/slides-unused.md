---

## The objective: the primitive I kept needing

Every project circled the same small set of needs:

- A place to **run some JavaScript**, pull in a few modules
- Take some **inputs**, produce some **outputs**
- Be **portable** — embeddable anywhere, editable in place
- And it **always just works**, every time someone opens it

<p class="concl">No login. No database link to break. No gating. Open it → you have <em>everything</em>.</p>

Note: The honest origin story: I kept rebuilding the same thing for different
teams — editable dashboards, notebook components, visualization widgets. Each
time I wanted the same primitive: run some JS, take inputs, produce outputs, be
embeddable and editable, and reliably work for whoever opens it. Nothing
off-the-shelf did exactly that without dragging in a server, accounts, and a
hosting decision. framejs is that primitive.

---

## Examples: science, made interactive

<div class="gallery">
  <figure>
    <div class="embed-frame">
      <iframe data-src="https://framejs.io/j/6a549a9e3b64e73a2ed6481b36c25b1f694c436275e698366a29b7e47c8b4dd8" height="560" title="NGL protein viewer" allow="clipboard-read; clipboard-write"></iframe>
    </div>
    <figcaption><strong>Protein structure</strong> · NGL Viewer — <span class="muted">“visualize a protein using NGL Viewer”</span></figcaption>
  </figure>
  <figure>
    <div class="embed-frame">
      <iframe data-src="https://framejs.io/j/69a1461a7ec981c3d215b8c7ce69ae7037012677c3257be4a904ecb503ddba77" height="560" title="Cytoscape network" allow="clipboard-read; clipboard-write"></iframe>
    </div>
    <figcaption><strong>Network graph</strong> · Cytoscape — <span class="muted">“make an example using cytoscape”</span></figcaption>
  </figure>
</div>

Note: Two examples, each created from a one-line prompt, no local files. On the
left, a protein rendered with NGL Viewer — a real molecular-graphics library,
pulled from a CDN, running entirely in the browser. On the right, an interactive
network with Cytoscape. These are live and editable right now — and they're just
URLs you can paste anywhere.

---

## Where it plugs into the drug-discovery pipeline

<div class="pipeline">
  <div class="stage">
    <span class="who">Reference data</span>
    <h4>QM calculations</h4>
    <p>Energies, geometries, torsion scans — the ground truth.</p>
  </div>
  <span class="arrow">→</span>
  <div class="stage">
    <span class="who">OpenFF</span>
    <h4>Fit &amp; benchmark</h4>
    <p>Does the force field reproduce QM? Per-parameter, per-torsion.</p>
  </div>
  <span class="arrow">→</span>
  <div class="stage">
    <span class="who">OpenMM · OpenFE</span>
    <h4>Simulate &amp; score</h4>
    <p>Dynamics and binding free energies over a ligand network.</p>
  </div>
  <span class="arrow">→</span>
  <div class="stage">
    <span class="who">Structural biology</span>
    <h4>Inspect structures</h4>
    <p>Proteins, ligands, poses — in the browser, no install.</p>
  </div>
</div>

<p class="concl">Every stage is a <em>see-it-to-trust-it</em> moment. The same primitive serves all of them — interactive, not a static figure.</p>

Note: Zoom out to the whole drug-discovery loop, because that's where these
tools live. You start from QM reference data. OpenFF fits and benchmarks a force
field against it — that's the next two slides. OpenMM and OpenFE then run the
dynamics and the binding free energies across a ligand network — the slide you
just saw. And throughout you're inspecting 3D structures — the NGL viewer
earlier. Every arrow here is a moment where a scientist has to _look_ at the
data and decide whether to trust it. Historically each of those views is a
bespoke notebook plot. framejs gives you one primitive that covers all of them,
and the result is a link, not a screenshot.
