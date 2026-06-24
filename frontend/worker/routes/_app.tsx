import { define } from "@/utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>framejs.io</title>
      </head>
      <body class="bg-gray-50 text-gray-900 min-h-screen">
        <Component />
      </body>
    </html>
  );
});
