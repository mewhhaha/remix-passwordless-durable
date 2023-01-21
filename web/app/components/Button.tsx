import type { ComponentProps, FunctionComponent } from "react";

export const Button = <AS extends FunctionComponent<any>>({
  as: As,
  ...props
}: JSX.IntrinsicElements["button"] & ComponentProps<AS> & { as?: AS }) => {
  const Component = As ?? "button";

  return (
    <Component
      {...props}
      className={[
        "font-['Roboto'] px-4 py-2 border rounded-md border-gray-500 text-center",
        props.className !== undefined ? props.className : "",
      ].join(" ")}
    />
  );
};
