import type { ComponentProps, FunctionComponent } from "react";

export const Button = <
  AS extends FunctionComponent<any> | keyof JSX.IntrinsicElements = "button"
>({
  as: As,
  ...props
}: ([AS] extends [keyof JSX.IntrinsicElements]
  ? JSX.IntrinsicElements[AS]
  : ComponentProps<AS>) & { as?: AS }) => {
  const Component = As ?? "button";

  return (
    <Component
      {...props}
      className={[
        "font-['Roboto'] px-4 py-2 border rounded-md border-gray-500 text-center",
        "className" in props &&
        typeof props.className === "string" &&
        props.className
          ? props.className
          : "",
      ].join(" ")}
    />
  );
};
