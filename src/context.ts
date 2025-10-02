import { RequestContext } from './types';

/**
 * Builder class for creating request contexts.
 */
export class RequestContextBuilder {
  private context: RequestContext = {};

  /**
   * Set user ID.
   */
  withUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  /**
   * Set user email.
   */
  withUserEmail(userEmail: string): this {
    this.context.userEmail = userEmail;
    return this;
  }

  /**
   * Set country code.
   */
  withCountry(country: string): this {
    this.context.country = country;
    return this;
  }

  /**
   * Set device type.
   */
  withDeviceType(deviceType: string): this {
    this.context.deviceType = deviceType;
    return this;
  }

  /**
   * Set operating system.
   */
  withOs(os: string): this {
    this.context.os = os;
    return this;
  }

  /**
   * Set OS version.
   */
  withOsVersion(osVersion: string): this {
    this.context.osVersion = osVersion;
    return this;
  }

  /**
   * Set browser.
   */
  withBrowser(browser: string): this {
    this.context.browser = browser;
    return this;
  }

  /**
   * Set language code.
   */
  withLanguage(language: string): this {
    this.context.language = language;
    return this;
  }

  /**
   * Set user age.
   */
  withAge(age: number): this {
    this.context.age = age;
    return this;
  }

  /**
   * Set user gender.
   */
  withGender(gender: string): this {
    this.context.gender = gender;
    return this;
  }

  /**
   * Set a custom attribute.
   */
  set(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Set multiple custom attributes.
   */
  setMany(attributes: Record<string, unknown>): this {
    Object.assign(this.context, attributes);
    return this;
  }

  /**
   * Build the request context.
   */
  build(): RequestContext {
    return { ...this.context };
  }
}

/**
 * Create a new request context builder.
 */
export function createRequestContext(): RequestContextBuilder {
  return new RequestContextBuilder();
}

/**
 * Create a request context from an object.
 */
export function   fromObject(context: RequestContext): RequestContextBuilder {
    const builder = new RequestContextBuilder();
    (builder as any).context = { ...context };
    return builder;
  }
