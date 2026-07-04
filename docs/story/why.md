---

---

# Why FrameJS exists

I kept building the same thing.

For the AI researchers, they needed dynamic yet editable dashboards. Another team needed workflows with visualization. Notebook components that needed to be simple yet portable. Every time I would be circling the same primitive: run some JavaScript, some visualization, that can be embedded, edited in place, that always just **works**. Reliably. Every time someone else opens it. No login, or broken database link, no gating. And when someone opens it, they have *everything*.

The primitive I needed didn't exist, but the patterns needed to build it were all around me.

## The Mermaid moment

The ah-ha moment for me was discovering and creating diagrams with the [Mermaid live editor](https://mermaid.live/edit#pako:eNpVjbFugzAQhl_FuqmVSEQJDsZDpYa0WSK1Q6ZCBiscGDXYyBilKfDuNURV25vu9H3_fz2cdI7AoTjry0kKY8lhmyni5ilNpKlaW4v2SBaLx2GHltRa4XUgm7udJq3UTVOp8v7mbyaJJP1-0pBYWamP8YaSOf-qcCDbdC8aq5vjX3K46IE8p9WbdPX_iTToUi9pIXghFidhSCLMrIAHpaly4NZ06EGNphbTCf1EM7ASa8yAuzXHQnRnm0GmRhdrhHrXuv5JGt2VElz9uXVX1-TC4rYSpRG_CqocTaI7ZYHTuQF4D5_AVyu2jFkYsFUYRsGarj24Ag_pMgjjmDFKaeyzYPTga_7oL1lEfTcPfhTEjkXjN-ESdl8). You type a few lines of markup, you get a diagram, and the *entire* state of your diagram is encoded in the URL. Specifically, in the hash, the part after the `#`, which the browser never sends to the server. The idea that the core part of a web app was encoded in the URL took me a bit to appreciate.

The hash (`#`) content of the url does a lot of work:

- There's no backend processing the diagram. The frontend site is just static assets.
- There's no database holding your diagram. *You* are holding it, in the link.
- If you share the link, the recipient has everything they need. Nothing to look up, nothing to fetch, nothing that can go missing.
- The recipient can directly edit your diagram
- There's no server to maintain, scale, or pay for as the thing grows.

It's a renderer that's also an editor that's also the storage layer, and the storage layer is just... the URL you already have. That's a strange and good shape for a piece of software to have. It's completely self-contained. In a sense, the http protocol gets extended, where https://mermaid.live is a promise to always render diagrams. This pattern had the potential to unlock a lot of innovation.

## What I actually wanted

When I drill into what I kept reaching for, it's a small set of things

- A place to run some JavaScript.
- Pull in a few modules.
- Take some inputs, produce some outputs.
- Be portable. Embeddable anywhere. Editable in place.

And yet there's no off-the-shelf thing that does exactly that without dragging in a server, an account system, a hosting decision, and a maintenance burden.

FrameJS is that thing I built to solve this. Code lives in the URL hash and the page renders it. Quick and efficient. When you want a shorter link, the server takes your code, drops it in a bucket, returns a hash, and forgets about it — it never *executes* your code, never *inspects* it in any meaningful way. It's a dumb store, on purpose.

## Privacy and shareability are connected and it's not a paradox or contradiction

People assume sharing and privacy are in tension. The more shareable a thing is, the more it must be leaking out into the world; the more private it is, the more locked-down and unmovable it must be.

But to make something *truly* shareable across apps, across domains, across people who don't have accounts on your service, the thing has to be fully self-contained. It can't be scattered across rows in your database and assets on your CDN and config in your auth service. It has to be one bundle, complete in itself. Being shareable *within* an app is trivial, and creates more lock-in, and platform owners are often incentivised to keep everything in-app.

The moment a thing is fully self-contained, privacy comes for free. If you don't share it, nobody has it. There's no server-side copy with your name on it, sitting in a backup, waiting to be queried by someone who isn't you. The same property that makes it portable is the property that makes it private.

So the paradox dissolves. Self-contained → shareable. Self-contained → private. They're the same property pointing in two directions.

This is, I'd argue, basically the opposite of the standard SaaS shape, where your data lives on someone's server because that's how they make money from you. There's nothing wrong with that model in general but it's not the right shape for everything, and it's definitely not the right shape for the small, sharp, shareable components I kept wanting to build.

## Editable websites you can actually trust to your users

Once a Frame is just a URL pointing at code-in-a-hash, something interesting happens to the surrounding website.

You can embed a Frame in your app as an iframe. The iframe is cross-origin to your site. That means the browser, by default, won't let the Frame poke at your page, read your cookies, or know much of anything about its parent beyond "I exist inside something." The blast radius of whatever runs inside is small and well-understood: it's the same isolation model the web has been hardening for twenty years.

Which means: you can let your users edit the code. Real code. Running in your product. Without it being a security incident, since their code cannot reach out unless you explicitly grant it.

For most of web history this has been a wildly impractical idea. You'd need a sandbox, a code review pipeline, a way to revoke things, terms of service nobody reads. With Frames, the sandbox is the iframe, the storage is the URL, and there's no shared state to compromise. The user types, the Frame re-renders, the parent page is fine. If the user shares the URL with a friend, the friend gets exactly the same thing.

This is a small primitive with surprisingly large consequences. It means a product can ship with a 30%-finished feature and let users finish the other 70% themselves, for their own use cases, without the product team having to anticipate every shape that "their own use cases" might take. Combined with AI that can generate these little components on demand, which is now a thing that happens, users aren't just customizing settings. They're authoring software inside your software. Safely.

## The bigger shape

Frames are not just isolated pages. The [Metapage framework](https://docs.metapage.io/) around them lets Frames stream inputs into each other, send outputs out, store files, snapshot state, and share those snapshots. So the unit isn't really "a Frame" — it's a graph of Frames, each one a small honest component, the whole thing still encoded in URLs you can paste around.

I think there's a version of the web that leans into this shape. Where the small useful thing you made — the calculator, the visualization, the data-cleaning utility, the diagram — doesn't have to become A Product with a backend to be useful to someone else. You just send the link. They have it. They can use it, edit it, fork it, embed it in their thing, and you didn't have to host anything for any of that to be true.

With the development of tools such as Claude Code, creating self-contained websites is now available to everyone with a voice.


## Example <a href="https://framejs.io/j/019f2b53304f788d9fe1d00556489768" target="_blank" rel="noopener noreferrer">↗</a>

<iframe
  src="https://framejs.io/j/019f2b53304f788d9fe1d00556489768"
  width="100%"
  height="500"
  frameborder="0"
  style="border: 1px solid var(--vp-c-border); border-radius: 8px;"
  allow="clipboard-read; clipboard-write"
></iframe>

