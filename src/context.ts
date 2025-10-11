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
    this.context['user.id'] = userId;
    return this;
  }

  /**
   * Set user email.
   */
  withUserEmail(userEmail: string): this {
    this.context['user.email'] = userEmail;
    return this;
  }

  /**
   * Set whether user is anonymous.
   */
  withAnonymous(anonymous: boolean): this {
    this.context['user.anonymous'] = anonymous;
    return this;
  }

  /**
   * Set country code.
   */
  withCountry(country: string): this {
    this.context.country_code = country;
    return this;
  }

  /**
   * Set region.
   */
  withRegion(region: string): this {
    this.context.region = region;
    return this;
  }

  /**
   * Set city.
   */
  withCity(city: string): this {
    this.context.city = city;
    return this;
  }

  /**
   * Set device type.
   */
  withDeviceType(deviceType: string): this {
    this.context.device_type = deviceType;
    return this;
  }

  /**
   * Set device manufacturer.
   */
  withManufacturer(manufacturer: string): this {
    this.context.manufacturer = manufacturer;
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
    this.context.os_version = osVersion;
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
   * Set browser version.
   */
  withBrowserVersion(browserVersion: string): this {
    this.context.browser_version = browserVersion;
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
   * Set connection type.
   */
  withConnectionType(connectionType: string): this {
    this.context.connection_type = connectionType;
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
   * Set IP address.
   */
  withIp(ip: string): this {
    this.context.ip = ip;
    return this;
  }

  /**
   * Set application version.
   */
  withAppVersion(appVersion: string): this {
    this.context.app_version = appVersion;
    return this;
  }

  /**
   * Set platform.
   */
  withPlatform(platform: string): this {
    this.context.platform = platform;
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
