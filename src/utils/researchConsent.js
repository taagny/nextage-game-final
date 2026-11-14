import { RESEARCH_CONSENT_VERSION, TERMS_VERSION } from "./constants.js"

export function hasResearchConsent(player) {
  return player?.termsAccepted === true && player.termsVersion === TERMS_VERSION &&
    player.researchConsent?.accepted === true &&
    player.researchConsent.version === RESEARCH_CONSENT_VERSION &&
    Boolean(player.researchConsent.updatedAt)
}
