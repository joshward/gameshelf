import { default as xml2js } from 'xml2js';

export class XmlValue {
  constructor(
    private value: any,
    private name: string,
  ) {}

  public readonly asString = (): string => {
    if (typeof this.value !== 'string') {
      throw new Error(`Error Parsing XML Value ${this.name} as string. Value is unexpected type ${typeof this.value}.`);
    }

    return this.value;
  }

  public readonly asInt = (): number => {
    const intValue = parseInt(this.value, 10);
    if (isNaN(intValue)) {
      throw new Error(`Error Parsing XML Value ${this.name} as int. Value is not an int "${this.value}".`);
    }

    return intValue;
  }

  public readonly asDecimal = (): number => {
    const numberValue = parseFloat(this.value);
    if (isNaN(numberValue) || !isFinite(numberValue)) {
      throw new Error(`Error Parsing XML Value ${this.name} as float. Value is not a float "${this.value}".`);
    }

    return numberValue;
  }
}

export class XmlElement {
  constructor(
    private element: any,
    private name: string,
  ) {}

  public getAttribute(key: string, options: { optional: true }): XmlValue | undefined;
  public getAttribute(key: string, options?: { optional?: false }): XmlValue;
  public getAttribute(key: string, options?: { optional?: boolean }): XmlValue | undefined {
    if (this.element === undefined) {
      throw new Error(`Error Parsing XML Element ${this.name}. Element does not exist.`);
    }

    const attribute = this.element['_attributes']?.[key];
    if (attribute === undefined) {
      if (options?.optional) {
        return undefined;
      }

      throw new Error(`Error Parsing XML Element ${this.name}. Attribute ${key} does not exist.`);
    }

    return new XmlValue(attribute, `${this.name}(${key})`);
  }

  public getText(options: { optional: true }): XmlValue | undefined;
  public getText(options?: { optional?: false }): XmlValue;
  public getText(options?: { optional?: boolean }): XmlValue | undefined {
    if (this.element === undefined) {
      throw new Error(`Error Parsing XML Element ${this.name}. Element does not exist.`);
    }

    const text = this.element['_text'];
    if (text === undefined) {
      if (options?.optional) {
        return undefined;
      }

      throw new Error(`Error Parsing XML Element ${this.name}. No inner text exists.`);
    }

    return new XmlValue(text, `${this.name}<text>`);
  }

  public getNode(key: string): XmlNode {
    return new XmlNode(this.element[key], `${this.name}.${key}`);
  }

  public toString(): string {
    return JSON.stringify(this.element, undefined, 2);
  }
}

export class XmlNode {
  constructor(
    private node: any,
    private name: string
  ) {}

  public readonly asMany = (): XmlElement[] => {
    if (!Array.isArray(this.node)) {
      if (!this.node) {
        return [];
      }
      throw new Error(`Error Parsing XML Node ${this.name}. Expected array, got ${typeof this.node}.`);
    }

    return this.node
      .map(element => new XmlElement(element, this.name));
  }

  public asSingle(options: { optional: true }): XmlElement | undefined;
  public asSingle(options?: { optional?: false }): XmlElement;
  public asSingle(options?: { optional?: boolean }): XmlElement | undefined {
    if (!Array.isArray(this.node)) {
      if (!this.node) {
        if (options?.optional) {
          return undefined;
        }

        throw new Error(`Error Parsing XML Node ${this.name}. Expected single value got missing parent.`);
      }
      throw new Error(`Error Parsing XML Node ${this.name}. Expected array, got ${typeof this.node}.`);
    }

    if(this.node.length !== 1) {
      if (this.node.length === 0) {
        if (options?.optional) {
          return undefined;
        }

        throw new Error(`Error Parsing XML Node ${this.name}. Expected single value got nothing.`);
      }
      throw new Error(`Error Parsing XML Node ${this.name}. Expected single value got multiple values.`);
    }

    return new XmlElement(this.node[0], this.name);
  }

  public toString(): string {
    return JSON.stringify(this.node, undefined, 2);
  }
}

export class XmlReader {
  private constructor(private root: any) {}

  public static readonly parse = async (xml: string) => {
    const parsed = await xml2js.parseStringPromise(xml, {
      attrkey: '_attributes',
      charkey: '_text',
      explicitRoot: false,
      explicitCharkey: true,
    });

    return new XmlReader(parsed);
  }

  public readonly getNode = (key: string): XmlNode =>
    new XmlNode(this.root[key], key);
}
