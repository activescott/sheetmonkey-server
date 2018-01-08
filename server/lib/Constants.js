'use strict'
class Constants {
  /**
   * Returns the list of extension IDs that are known to be legit.
   * Sorted such that development environment IDs come first.
   */
  static get legitExtensionIDs () {
    const sheetmonkeyExtensionIDDev = 'ffnljkjkjkjalaeioncbnbpfgnkohblm'
    const sheetmonkeyExtensionIDProd = 'gdnefhegodkfgopmjacoenelkfkbkkdg'
    return [sheetmonkeyExtensionIDDev, sheetmonkeyExtensionIDProd]
  }
}

module.exports = Constants
