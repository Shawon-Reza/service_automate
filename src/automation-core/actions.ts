import type { Browser } from "webdriverio";

export const actions = {
  async tapByAccessibilityId(driver: Browser, accessibilityId: string): Promise<void> {
    await driver.$(`~${accessibilityId}`).click();
  },

  async tapByResourceId(driver: Browser, resourceId: string): Promise<void> {
    await driver.$(`id=${resourceId}`).click();
  },

  async tapByText(driver: Browser, text: string): Promise<void> {
    await driver.$(`android=new UiSelector().text(${JSON.stringify(text)})`).click();
  },

  async typeText(driver: Browser, selector: string, text: string): Promise<void> {
    await driver.$(selector).setValue(text);
  },

  async clearInput(driver: Browser, selector: string): Promise<void> {
    await driver.$(selector).clearValue();
  },

  async getText(driver: Browser, selector: string): Promise<string> {
    return driver.$(selector).getText();
  },

  async pressBack(driver: Browser): Promise<void> {
    await driver.back();
  },

  async hideKeyboard(driver: Browser): Promise<void> {
    await driver.hideKeyboard();
  },
};
