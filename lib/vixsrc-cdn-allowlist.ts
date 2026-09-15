/** Keep in sync with zima/vixsrc-relay/relay.py */
export const VIXSRC_ORIGIN_HOST_PATTERN =
    String.raw`^(?:[a-z0-9-]+\.)*(?:vixsrc\.to|vix-content\.net)$`

/** VixSrc ruota il TLD (`.fun`, `.xyz`, …). Resta vincolato al nodo `sc-*`. */
export const VIXSRC_EDGE_CDN_HOST_PATTERN = String.raw`^sc-[a-z0-9]+-\d+\.[a-z0-9.-]+$`

export const VIXSRC_ORIGIN_HOST = new RegExp(VIXSRC_ORIGIN_HOST_PATTERN, 'i')
export const VIXSRC_EDGE_CDN_HOST = new RegExp(VIXSRC_EDGE_CDN_HOST_PATTERN, 'i')
