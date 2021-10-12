export type FormObject = Record<PropertyKey, unknown>

export type Description = string | string[] | JSX.Element | undefined | false

export interface ValueRendererProps<T> {
  value: T;
}

export interface ComponentRendererProps<T> {
  onError: (error: string) => void;
  onClearError: () => void;
  onChange: (value: T) => void;
  value: T;
  error: string | undefined;
}

export interface FormInputCommon<T> {
  readonly label?: string;
  readonly description?: Description;
  readonly required?: boolean;
  readonly initialValue?: T;
}

export interface FormInput<T> extends FormInputCommon<T> {
  readonly defaultValue: T;
  readonly isValueSet: (value: T) => boolean;
  readonly valueRenderer: (props: ValueRendererProps<T>) => JSX.Element;
  readonly componentRenderer: (props: ComponentRendererProps<T>) => JSX.Element;
}

export type FormStructure<T extends Record<PropertyKey, unknown>> = {
  readonly [P in keyof T]: FormInput<T[P]>
}
