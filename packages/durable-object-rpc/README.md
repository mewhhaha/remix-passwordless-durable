# Durable Object RPC
This is a small package to ease the friction when communicating with a `Durable Object` binding. This package is under development and if you want to use it in any stable capacity I suggest you copy over the code and maintain it yourself. If you do any good improvements it'd be greatly appreciated if you can contribute back. There will likely be a lot of breaking packages when this package updates as it is in its infancy.

## Example
This is a simple example using the library.

```ts
// In your worker most likely
class DurableObjectExample extends CallableDurableObject {
    // Arguments have to be JSON compatible values
    helloWorld(_: Request, name: string) { // Important that this takes request as the first argument
        return respond(`Hello world, ${name}!`)
    }
}


// In whoever is calling the worker, for example a pages function
type Env = {
  DO_EXAMPLE: DurableObjectNamespaceIs<DurableObjectExample>;
};

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  const id = "MY_DO_ID"; // Could also be a DurableObjectId
  const c = client(request, env.DO_EXAMPLE, id);
  const value = await c.helloWorld("MY NAME");

  return new Response(value, { status: 200 });
}
```