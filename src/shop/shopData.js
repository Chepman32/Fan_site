import { shopCentsToPrice, shopPriceToCents } from './paymentConfig'
import { slugify } from '../data/slugify'

export {
  PAYMENT_ADDRESS,
  PAYMENT_NETWORK,
  PAYMENT_NETWORK_SUFFIX,
  P2P_COMMISSION_PERCENT_LABEL,
  P2P_COMMISSION_RATE,
  P2P_PLATFORM_USDT_ADDRESS,
  TRONGRID_FULL_HOST,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
  USDT_TRANSFER_FEE_LIMIT,
  formatShopPrice,
  formatUsdtAmount,
  shopCentsToPrice,
  shopPriceToCents,
} from './paymentConfig'

const PRICE_INCREMENT_CENTS = 1

const overlayImageModules = {
  ...import.meta.glob('../assets/shop/Stream overlay previews/*.webp', {
    eager: true,
    import: 'default',
  }),
}

const profileBannerImageModules = {
  ...import.meta.glob('../assets/shop/Profile banner previews/*.webp', {
    eager: true,
    import: 'default',
  }),
}

const emotePackPreviewImageModules = {
  ...import.meta.glob('../assets/shop/Emote pack previews/*/*.webp', {
    eager: true,
    import: 'default',
  }),
}

const emotePackSheetImageModules = {
  ...import.meta.glob('../assets/shop/Emote pack sheet previews/*.webp', {
    eager: true,
    import: 'default',
  }),
}

const overlayNames = [
  'Vice Nights Broadcast Kit',
  'Ocean Drive Stream Suite',
  'Neon Storm Overlay Bundle',
  'Leonida Heat Scene Pack',
  'Downtown Chase Creator Pack',
  'Keys Sunset Stream Kit',
  'Port Gellhorn Night Set',
  'Paradise Hotel Overlay Pack',
  'Blue Line Stream Pack',
  'Get Ready Overlay Suite',
  'Coastal Stunt Broadcast Kit',
  'Grassrivers Creator Frame',
  'Downtown Start Screen',
  'Lifeguard Stream Kit',
  'Beachside Countdown Set',
  'Port Vice City Overlay',
  'Starlight Strip Broadcast Kit',
  'Six Star Chase Pack',
  'Driveway Stream Scene',
  'Bay City Overlay Kit',
  'Backroad Creator Pack',
  'Club Neon Stream Set',
  'Ocean View Intermission Kit',
  'Airstrip Chase Overlay',
  'Palm Island Broadcast Kit',
  'Glades Trail Stream Set',
  'Highway Heat Creator Pack',
  'Vice Marina Broadcast Suite',
  'Little Haiti Night Overlay',
  'South Beach Alert Kit',
  'Leonida Motel Intermission',
  'Keys Bridge Stream Pack',
  'Rooftop Chase Scene Set',
  'Vice Port Gameplay Frame',
  'Neon Palms Chat Overlay',
  'Downtown Radio Creator Kit',
  'Grassrivers Watch Party Set',
  'Sunset Highway Overlay Suite',
  'Ambrosia Stream Scene Pack',
  'Mount Kalaga Creator Kit',
  'Ocean Pier Broadcast Set',
  'Vice Club Starting Screen',
  'Bayfront Pursuit Overlay',
  'Leonida Coast Live Kit',
  'Night Run Stream Bundle',
]

const overlayTags = [
  ['Animated-ready', 'Facecam', 'Alerts'],
  ['Starting soon', 'Social lower third', 'Donation panel'],
  ['BRB scene', 'Subscriber panel', 'Purple neon'],
  ['Gameplay frame', 'Chat panel', 'Cyan HUD'],
  ['Racing theme', 'Goal bar', 'Creator badges'],
  ['Beach scene', 'Follower alert', 'Turquoise trim'],
  ['Night city', 'Motel frame', 'High contrast'],
  ['Vice City', 'Pink trim', 'Full stream set'],
]

const fallbackOverlayTags = [
  ['Stream overlay', 'Creator asset', 'Leonida style'],
  ['Starting soon', 'Countdown', 'Broadcast-ready'],
  ['Gameplay frame', 'Facecam', 'Chat panel'],
  ['Intermission', 'Social panel', 'Neon trim'],
  ['Alerts', 'Lower third', 'Creator badges'],
  ['Race scene', 'Goal bar', 'High contrast'],
]

const streamOverlayAlternateAspectRatioStems = new Set(['40', '41', '42', '43', '44', '45'])

const streamOverlayDownloadsByStem = {
  1: 'https://drive.google.com/file/d/1J3EOza0DZTuD2cPEWpqeSdxgy0GZw8E3/view?usp=sharing',
  2: 'https://drive.google.com/file/d/1oe1YjJkWDxMsVh2eJdOcCxi_dMTB_o7a/view?usp=sharing',
  3: 'https://drive.google.com/file/d/1eK3ONLP49nQjuKO7ObXEPPfYKqavVljS/view?usp=sharing',
  4: 'https://drive.google.com/file/d/1VOeRyXvXBoeCTQXeeHepLMx3WK93SnZG/view?usp=sharing',
  5: 'https://drive.google.com/file/d/1YkW1DvHlTC6vT0Wkklu-M-sf_mw4SACs/view?usp=sharing',
  6: 'https://drive.google.com/file/d/1qQYoeJwYV1WO4sfREcxi1h3zYuUhIgT4/view?usp=sharing',
  7: 'https://drive.google.com/file/d/10APZkJcuNjyrCYMv1F5u-COumwQxb3_s/view?usp=sharing',
  8: 'https://drive.google.com/file/d/14GAuI0ZZoTqpSqdBaRJ1rBUJzx8yW_Zh/view?usp=sharing',
  9: 'https://drive.google.com/file/d/1Wk9NRXO8g8JDlAoMFGAi4QwZQKP98hkK/view?usp=sharing',
  10: 'https://drive.google.com/file/d/1ufEWsL8K97C2hwvaqZuN9raU42N1oF2R/view?usp=sharing',
  11: 'https://drive.google.com/file/d/1rZO4cRtT5N5NlEAYeGgl0ZBER4AY6zxa/view?usp=sharing',
  12: 'https://drive.google.com/file/d/158AwKhZV7tBgmgTUHPqf4Rq3YWkRF8br/view?usp=sharing',
  13: 'https://drive.google.com/file/d/1l_YBZA7Ef1H5fnZ1RMxwIuPWkz6UTvPL/view?usp=sharing',
  14: 'https://drive.google.com/file/d/1yve4jjShFDdZsYJD7JrKXYy_TzS8pEjr/view?usp=sharing',
  15: 'https://drive.google.com/file/d/1Q3bDN21x0-kXKDjDtmqfh8QkkAA9qLbU/view?usp=sharing',
  16: 'https://drive.google.com/file/d/15zmPyg2JVoVmDxM7waN8nbbmsMRjFkCf/view?usp=sharing',
  17: 'https://drive.google.com/file/d/17OvSKvm1BzN72MjX9sCLLwUNirniW3zo/view?usp=sharing',
  18: 'https://drive.google.com/file/d/1HXrRpPdw89KavHraU1cVLJFPeOmazr5c/view?usp=sharing',
  19: 'https://drive.google.com/file/d/1HOkfiOufoy5nqbLZ_-GUTltpuZ22i9R5/view?usp=sharing',
  20: 'https://drive.google.com/file/d/18McDihyQux3molQBCP5q0Img8p8Z-B3U/view?usp=sharing',
  21: 'https://drive.google.com/file/d/1Di-Eyq0eANv5NRSIC_cn2G26na7OB9V6/view?usp=sharing',
  22: 'https://drive.google.com/file/d/1nEYkSoqzZwohkdd-M1cSJbJvWou-tYKJ/view?usp=sharing',
  23: 'https://drive.google.com/file/d/18eCwI2N5fA4KfzkGmZae9CueOc7IsbSP/view?usp=sharing',
  24: 'https://drive.google.com/file/d/1N4cwFGKTpL3e9soGbyEOUy9CMgo3_Zwn/view?usp=sharing',
  25: 'https://drive.google.com/file/d/1YubBUNa3ulHJ9JHl8zR8HmSPQkYhkFSV/view?usp=sharing',
  26: 'https://drive.google.com/file/d/1Viy5rrgZ0Aqqx6HCGvMFFDqvpHPNBhml/view?usp=sharing',
  27: 'https://drive.google.com/file/d/1PolUxCRLc1p9NtvCjJhip3RHqo_Gn08k/view?usp=sharing',
  28: 'https://drive.google.com/file/d/13WiMFRQmgq4HVcS6ZL780_u8vftF_zsc/view?usp=sharing',
  29: 'https://drive.google.com/file/d/1I1tRpi_If3BSnXt-OST5sUPrhO8sQUMp/view?usp=sharing',
  30: 'https://drive.google.com/file/d/1vWFpOQaZeSIyHLQYzHBaFEZGFbI1uO8o/view?usp=sharing',
  31: 'https://drive.google.com/file/d/1NZbD9jfSN975oyks6KmdqJuFRMvtxi0t/view?usp=sharing',
  32: 'https://drive.google.com/file/d/1Io8AKWg96MMCg6ANxhnIfbLCpUfHfkMb/view?usp=sharing',
  33: 'https://drive.google.com/file/d/17TtnDQ2U-Ntcqss9SN_1fdVL321x6KaI/view?usp=sharing',
  34: 'https://drive.google.com/file/d/1fqauPpPXs52WN3fSuPk2JZPhXDNqNycL/view?usp=sharing',
  35: 'https://drive.google.com/file/d/1ajOpXjib5XfwlYh9mvovL2nvim2f8TYf/view?usp=sharing',
  36: 'https://drive.google.com/file/d/1tdk8exbxDPwtV4JinnEhad7rBjwCwRTl/view?usp=sharing',
  37: 'https://drive.google.com/file/d/1GTnfhkMl0r-KeJFE5cu4qtz6O6goDH32/view?usp=sharing',
  38: 'https://drive.google.com/file/d/1k9ybuAwA6SKNT7NN01hRYN_UwW3pLlTe/view?usp=sharing',
  39: 'https://drive.google.com/file/d/19nKB8I0ewWWEVA-YdBLTNO83PMq24L59/view?usp=sharing',
  40: 'https://drive.google.com/file/d/10n0zcjGsj6THe5drc_EJQRz63kRlGZoa/view?usp=sharing',
  41: 'https://drive.google.com/file/d/1Cw-rMaO9tmYDAwQiWNxQOVj2fgSfwHwv/view?usp=sharing',
  42: 'https://drive.google.com/file/d/1XcXjjiAOR_JFBCtOhucWW3W_tt6O2LTE/view?usp=sharing',
  43: 'https://drive.google.com/file/d/1Weyer6Gwb9ItLyzBWeNt6dLD9ORX-M3R/view?usp=sharing',
  44: 'https://drive.google.com/file/d/1GNR7ZGAwC3SfI3nzOq-YLk6jc30BPT7M/view?usp=sharing',
  45: 'https://drive.google.com/file/d/1NSOon_XdtbY2MgafzO-muhC6KKROgdok/view?usp=sharing',
}

const profileBannerTags = [
  ['Profile header', 'Creator page', 'Wide format'],
  ['Social banner', 'Neon grade', 'Fan profile'],
  ['Community header', 'Leonida style', 'PNG asset'],
  ['Hero banner', 'Cover image', 'High impact'],
  ['Profile art', 'Cinematic crop', 'Ready to upload'],
]

const profileBannerDownloadsByStem = {
  '0759a51c-607d-4d04-bf21-7e1c9c502c1c_0': 'https://drive.google.com/file/d/1HdL4IT4X09Niy6hcZcWLlwSNPOa7_qOm/view?usp=sharing',
  '1E26FFA9-C375-436A-8A94-EAB5E3852A24': 'https://drive.google.com/file/d/1QKj2vn9SAmSDSGK6Mye6YVVXoOUZKVeB/view?usp=sharing',
  '3B8210F2-85D5-4CB4-AC5B-5E70C8D921E0': 'https://drive.google.com/file/d/1nnfrmCxE5PRbrMFik_fxt1j8xTdg5lnF/view?usp=sharing',
  '03CEC807-70AF-454F-94CB-80960BCA6D42': 'https://drive.google.com/file/d/1X8qS-0nkcVCZjScJmakIEaa8Q6ijPBMo/view?usp=sharing',
  '4A84227E-728E-4910-8DDA-C72E2B38EB03': 'https://drive.google.com/file/d/1CxjWZEJXSeZQeE3PdhA6eD6UQKKlvYp4/view?usp=sharing',
  '549a1ce9-7bb8-4947-9d3f-93de45b6892f_0': 'https://drive.google.com/file/d/1_QVrAtsWXVY1lUXD7w-2jhhzpOvSDq2x/view?usp=sharing',
  '5C9F78B2-0BEC-4A88-AEB8-04DFE0A10271': 'https://drive.google.com/file/d/1vtSKBqPify5JZvacqMc6M6ZvhmfYKdRn/view?usp=sharing',
  '6CD700E5-3310-42CB-99C3-3F8854511101': 'https://drive.google.com/file/d/1nUbujBY6V1X0LfIrdv6FA_APgL2K5mZl/view?usp=sharing',
  '7D6C2FBB-4B35-4F4B-A393-0E94841F5548': 'https://drive.google.com/file/d/1sH6VkUCX-yzYODDVNPXwNPL5T8Y9CS3m/view?usp=sharing',
  '8EB5B9EB-E21B-498C-8019-3C75C52BF082': 'https://drive.google.com/file/d/1iIfSx-UvpID7pfzxyDPmMPMV99leq-by/view?usp=sharing',
  '24C2F4DA-EEA8-4A0E-AEE0-B5CE70E8B8DA': 'https://drive.google.com/file/d/1YzQdJ05HgZ6yO3kjV3ZVRxrrLar6e5Gq/view?usp=sharing',
  '27FF00B9-8899-4880-B937-3E22D93CBA84': 'https://drive.google.com/file/d/1lDF2Vy5bMy_LIxaYMRN9hTA_y78XyNhp/view?usp=sharing',
  '60BC3A78-1EB0-4784-89D1-5DE090584F4F': 'https://drive.google.com/file/d/1oakAqAtADmsPgf2pXud2p-nuLQFd_4GN/view?usp=sharing',
  '93F89890-F642-4EFF-A3B3-7ABEF9AAAC2F': 'https://drive.google.com/file/d/1FVgQa1hOd7Gm2kBJtq4bKubuczIpGZsa/view?usp=sharing',
  '187E7061-ABAE-42C5-B451-D3D44FFA74F3': 'https://drive.google.com/file/d/1yWlCIRLMfWyxBUES6w5hv1WPdqRgtMtH/view?usp=sharing',
  '191F89AE-9293-46C6-9D0E-216C149CE783': 'https://drive.google.com/file/d/1aiGZYWFRwdAFD0mla-bR3GxvB-_5TrkZy/view?usp=sharing',
  '452BAB35-D9CC-4512-8133-5B19F6544977': 'https://drive.google.com/file/d/1s_0d3y1mBwXa7shtuRPwLZCeLyfJ4v00/view?usp=sharing',
  '74169517-2A97-4BF8-A8E4-84C0082CC604': 'https://drive.google.com/file/d/1_iQCIvXKknPgtB83DLhAPG7AhnRH7EgS/view?usp=sharing',
  'A2FF8B11-C8FB-494A-9919-B1A51888B9F0': 'https://drive.google.com/file/d/17wsmFN31oXiI4J5PWcUIcDe9YdDFaut6/view?usp=sharing',
  'ACD228CA-D222-4B57-8ABF-7190AD7FE2D8': 'https://drive.google.com/file/d/1zWRFSYx6GC56BJRJUiprTtRdBrptxIMH/view?usp=sharing',
  'B7A7EEDD-4A0B-43A9-9D41-893635EA6D91': 'https://drive.google.com/file/d/1tJKB1oVHCdXP5sYOFX49gSTEjnqjenSa/view?usp=sharing',
  'B258C7DE-E4DF-422E-9367-771E272E552A': 'https://drive.google.com/file/d/1uDBfOcX-QyEBOaSmJ5ZxZ2FQ2lyS0FU2/view?usp=sharing',
  'C2BF7912-21C5-4F17-B7D0-F7325483262C': 'https://drive.google.com/file/d/12V8irE7kvn3mQZuTRIXGiG-ssr_-ZuHq/view?usp=sharing',
  'CFAF8C74-53F3-4008-966B-1F5C09995244': 'https://drive.google.com/file/d/1jwTI782-rC9t_MKuDtAiWwo6s5hII3Wy/view?usp=sharing',
  'D0EB85B5-8209-4C00-A5DB-36646775452D': 'https://drive.google.com/file/d/15_1h18PJVbOH_MnFfZAYUGlIoGC8F17-/view?usp=sharing',
  'D5CAD551-10E1-486A-B688-725F8781E266': 'https://drive.google.com/file/d/1eKCC8ns5qR5HCsN5qqzspVZtH0uDCkZy/view?usp=sharing',
  'FCEBA9CE-0A07-42A5-8023-C4FD0D231637': 'https://drive.google.com/file/d/1YfEUFOhZUjJN0g8Ly-CfChIoS_BtWKgS/view?usp=sharing',
  'IMG_2762-processed(lightpdf.com)': 'https://drive.google.com/file/d/1tOlM1A82VtdPHuOZTuAbsKpzawEunFKo/view?usp=sharing',
  'IMG_2763-processed(lightpdf.com)': 'https://drive.google.com/file/d/1nsRWnjNLYFeyGkhIOcTO1WNXbGdNMSau/view?usp=sharing',
  'IMG_2764-processed(lightpdf.com)': 'https://drive.google.com/file/d/1wTpil5VW-qoUDdW1sDIcwqrUaLUhoEgQ/view?usp=sharing',
  'd6755c77-d2f8-435e-ab20-a30ac15e7d60_0': 'https://drive.google.com/file/d/1HI6zic_H-kFJVyHZZo5_PwIATjcetyIw/view?usp=sharing',
  'wmremove-transformed': 'https://drive.google.com/file/d/109f4pmR9BUNT4XPAK9Z6IRPDsst83YvW/view?usp=sharing',
  'wmremove-transformed(1)': 'https://drive.google.com/file/d/1G1dy4i2d62g5xAc7nRn9RlFpDTmdXZkk/view?usp=sharing',
}

const profileBannerDownloadFileNamesByStem = {
  '0759a51c-607d-4d04-bf21-7e1c9c502c1c_0': '0759a51c-607d-4d04-bf21-7e1c9c502c1c_0.jpg',
  '549a1ce9-7bb8-4947-9d3f-93de45b6892f_0': '549a1ce9-7bb8-4947-9d3f-93de45b6892f_0.jpeg',
  'IMG_2762-processed(lightpdf.com)': 'IMG_2762-processed(lightpdf.com).jpeg',
  'IMG_2763-processed(lightpdf.com)': 'IMG_2763-processed(lightpdf.com).jpeg',
  'IMG_2764-processed(lightpdf.com)': 'IMG_2764-processed(lightpdf.com).jpeg',
  'd6755c77-d2f8-435e-ab20-a30ac15e7d60_0': 'd6755c77-d2f8-435e-ab20-a30ac15e7d60_0.jpg',
  'wmremove-transformed': 'wmremove-transformed.jpeg',
  'wmremove-transformed(1)': 'wmremove-transformed(1).jpeg',
}

const profileBannerMetaByStem = {
  '0759a51c-607d-4d04-bf21-7e1c9c502c1c_0': {
    title: 'Vice Glow Social Header',
    price: 10,
    tags: profileBannerTags[1],
  },
  '1E26FFA9-C375-436A-8A94-EAB5E3852A24': {
    title: 'Vice Skyline Profile Banner',
    price: 8,
    tags: profileBannerTags[0],
  },
  '3B8210F2-85D5-4CB4-AC5B-5E70C8D921E0': {
    title: 'Leonida Nightlife Banner',
    price: 10,
    tags: profileBannerTags[1],
  },
  '4A84227E-728E-4910-8DDA-C72E2B38EB03': {
    title: 'Port Gellhorn Banner',
    price: 12,
    tags: profileBannerTags[2],
  },
  '549a1ce9-7bb8-4947-9d3f-93de45b6892f_0': {
    title: 'Vice Afterglow Profile Banner',
    price: 12,
    tags: profileBannerTags[3],
  },
  '5C9F78B2-0BEC-4A88-AEB8-04DFE0A10271': {
    title: 'Ocean Drive Social Header',
    price: 8,
    tags: profileBannerTags[3],
  },
  '7D6C2FBB-4B35-4F4B-A393-0E94841F5548': {
    title: 'Downtown Vice Banner',
    price: 10,
    tags: profileBannerTags[4],
  },
  '8EB5B9EB-E21B-498C-8019-3C75C52BF082': {
    title: 'Keys Sunset Profile Header',
    price: 12,
    tags: profileBannerTags[0],
  },
  '24C2F4DA-EEA8-4A0E-AEE0-B5CE70E8B8DA': {
    title: 'Grassrivers Profile Banner',
    price: 8,
    tags: profileBannerTags[1],
  },
  '27FF00B9-8899-4880-B937-3E22D93CBA84': {
    title: 'Vice Beach Social Banner',
    price: 10,
    tags: profileBannerTags[2],
  },
  '60BC3A78-1EB0-4784-89D1-5DE090584F4F': {
    title: 'Neon Motel Header',
    price: 12,
    tags: profileBannerTags[3],
  },
  '187E7061-ABAE-42C5-B451-D3D44FFA74F3': {
    title: 'Ambrosia Profile Banner',
    price: 8,
    tags: profileBannerTags[4],
  },
  '191F89AE-9293-46C6-9D0E-216C149CE783': {
    title: 'Sahara Arena Social Header',
    price: 10,
    tags: profileBannerTags[0],
  },
  '452BAB35-D9CC-4512-8133-5B19F6544977': {
    title: 'Leonida Coast Banner',
    price: 12,
    tags: profileBannerTags[1],
  },
  'A2FF8B11-C8FB-494A-9919-B1A51888B9F0': {
    title: 'Vice City Creator Header',
    price: 8,
    tags: profileBannerTags[2],
  },
  'CFAF8C74-53F3-4008-966B-1F5C09995244': {
    title: 'Palm Coast Profile Banner',
    price: 10,
    tags: profileBannerTags[3],
  },
  'FCEBA9CE-0A07-42A5-8023-C4FD0D231637': {
    title: 'Vice Nights Social Header',
    price: 12,
    tags: profileBannerTags[4],
  },
  '03CEC807-70AF-454F-94CB-80960BCA6D42': {
    title: 'Vice Shoreline Banner',
    price: 12,
    tags: profileBannerTags[2],
  },
  '6CD700E5-3310-42CB-99C3-3F8854511101': {
    title: 'Night Drive Profile Header',
    price: 12,
    tags: profileBannerTags[4],
  },
  '74169517-2A97-4BF8-A8E4-84C0082CC604': {
    title: 'Keys Marina Social Banner',
    price: 8,
    tags: profileBannerTags[1],
  },
  '93F89890-F642-4EFF-A3B3-7ABEF9AAAC2F': {
    title: 'Downtown Heat Profile Banner',
    price: 12,
    tags: profileBannerTags[3],
  },
  'ACD228CA-D222-4B57-8ABF-7190AD7FE2D8': {
    title: 'Neon Boulevard Header',
    price: 12,
    tags: profileBannerTags[0],
  },
  'B258C7DE-E4DF-422E-9367-771E272E552A': {
    title: 'Port Leonida Cover Banner',
    price: 10,
    tags: profileBannerTags[2],
  },
  'B7A7EEDD-4A0B-43A9-9D41-893635EA6D91': {
    title: 'Ocean Club Profile Banner',
    price: 8,
    tags: profileBannerTags[4],
  },
  'C2BF7912-21C5-4F17-B7D0-F7325483262C': {
    title: 'Vice Palms Social Header',
    price: 12,
    tags: profileBannerTags[1],
  },
  'D0EB85B5-8209-4C00-A5DB-36646775452D': {
    title: 'Leonida Sunrise Banner',
    price: 10,
    tags: profileBannerTags[3],
  },
  'D5CAD551-10E1-486A-B688-725F8781E266': {
    title: 'High Roller Profile Header',
    price: 12,
    tags: profileBannerTags[0],
  },
  'IMG_2762-processed(lightpdf.com)': {
    title: 'Leonida Chase Profile Banner',
    price: 8,
    tags: profileBannerTags[4],
  },
  'IMG_2763-processed(lightpdf.com)': {
    title: 'Vice Palms Cover Banner',
    price: 10,
    tags: profileBannerTags[0],
  },
  'IMG_2764-processed(lightpdf.com)': {
    title: 'Downtown Fade Social Header',
    price: 12,
    tags: profileBannerTags[2],
  },
  'd6755c77-d2f8-435e-ab20-a30ac15e7d60_0': {
    title: 'Leonida Lights Profile Header',
    price: 8,
    tags: profileBannerTags[3],
  },
  'wmremove-transformed': {
    title: 'Vice Wave Profile Banner',
    price: 10,
    tags: profileBannerTags[1],
  },
  'wmremove-transformed(1)': {
    title: 'Keys Mirage Social Header',
    price: 12,
    tags: profileBannerTags[2],
  },
}

const profileBannerAspectRatiosByStem = {
  '0759a51c-607d-4d04-bf21-7e1c9c502c1c_0': '1624 / 600',
  '549a1ce9-7bb8-4947-9d3f-93de45b6892f_0': '1280 / 473',
  'IMG_2762-processed(lightpdf.com)': '1696 / 624',
  'IMG_2763-processed(lightpdf.com)': '1696 / 624',
  'IMG_2764-processed(lightpdf.com)': '1696 / 624',
  'd6755c77-d2f8-435e-ab20-a30ac15e7d60_0': '1624 / 600',
  'wmremove-transformed': '1696 / 624',
  'wmremove-transformed(1)': '1696 / 624',
}

const profileBannerStandardStems = new Set([
  '187E7061-ABAE-42C5-B451-D3D44FFA74F3',
  '24C2F4DA-EEA8-4A0E-AEE0-B5CE70E8B8DA',
  '27FF00B9-8899-4880-B937-3E22D93CBA84',
  '3B8210F2-85D5-4CB4-AC5B-5E70C8D921E0',
  '452BAB35-D9CC-4512-8133-5B19F6544977',
  '4A84227E-728E-4910-8DDA-C72E2B38EB03',
  '5C9F78B2-0BEC-4A88-AEB8-04DFE0A10271',
  '60BC3A78-1EB0-4784-89D1-5DE090584F4F',
  'A2FF8B11-C8FB-494A-9919-B1A51888B9F0',
  'CFAF8C74-53F3-4008-966B-1F5C09995244',
])

const emotePackMeta = {
  gta_vi_emote_pack_01: {
    title: 'Vice Hustle Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Chat reactions', 'Vice City style'],
  },
  gta_vi_emote_pack_02: {
    title: 'Leonida Heat Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Creator chat', 'Neon reactions'],
  },
  gta_vi_emote_pack_03: {
    title: 'Keys Flex Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Streamer-ready', 'Transparent PNG'],
  },
  gta_vi_emote_pack_04: {
    title: 'Vice Motion Emote Pack',
    price: 18,
    tags: ['11 emotes', 'Vehicle reactions', 'Neon chat'],
  },
  gta_vi_emote_pack_05: {
    title: 'Tropical Flex Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Tropical reactions', 'Gold trim'],
  },
  gta_vi_emote_pack_06: {
    title: 'Vice Radio Emote Pack',
    price: 16,
    tags: ['10 emotes', 'Broadcast chat', 'Arcade reactions'],
  },
}

const emotePackDownloadsByFolder = {
  gta_vi_emote_pack_01: 'https://drive.google.com/file/d/1Skcb1WERpbPyiTpb8x7UXKeQO6vHYq94/view?usp=sharing',
  gta_vi_emote_pack_02: 'https://drive.google.com/file/d/1wIX76V9M-0ZMvLCJVJPKdwlazON_1HDH/view?usp=sharing',
  gta_vi_emote_pack_03: 'https://drive.google.com/file/d/1OCGcmJXJG6kZivkWHp-X80h3VRH4cmjy/view?usp=sharing',
  gta_vi_emote_pack_04: 'https://drive.google.com/file/d/1TRK9HOuJdDAGbV3lXxbM1bL2Ne-Dd4ee/view?usp=sharing',
  gta_vi_emote_pack_05: 'https://drive.google.com/file/d/1KaLU94IVWsG9tE1_9m6CGNjhCVY9urA2/view?usp=sharing',
  gta_vi_emote_pack_06: 'https://drive.google.com/file/d/1vjd2w40IjiwNXWxFYAZru7gzzMvAsL0E/view?usp=sharing',
}

function overlayFileStem(path) {
  return path.split('/').pop()?.replace(/\.(png|webp)$/i, '') || ''
}

function emotePackFolder(path) {
  const segments = path.split('/')
  return segments[segments.length - 2] || ''
}

function sortedImageEntries(modules) {
  return Object.entries(modules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' }))
}

function sortedEmotePacks() {
  const sheetImagesByFolder = new Map(
    sortedImageEntries(emotePackSheetImageModules).map(([path, image]) => [overlayFileStem(path), image]),
  )
  const packs = new Map()

  sortedImageEntries(emotePackPreviewImageModules).forEach(([path, image]) => {
    const folder = emotePackFolder(path)
    if (!folder) return

    const pack = packs.get(folder) || { folder, previewImage: sheetImagesByFolder.get(folder), images: [] }
    pack.images.push(image)
    packs.set(folder, pack)
  })

  return Array.from(packs.values())
    .sort((packA, packB) => packA.folder.localeCompare(packB.folder, undefined, { numeric: true, sensitivity: 'base' }))
}

function profileBannerAspectRatio(stem) {
  if (profileBannerAspectRatiosByStem[stem]) return profileBannerAspectRatiosByStem[stem]

  return profileBannerStandardStems.has(stem) ? '1983 / 793' : '1916 / 821'
}

function assignUniqueShopPrices(productGroups) {
  const usedPrices = new Set()

  return productGroups.map((products) => (
    products.map((product) => {
      const basePriceCents = shopPriceToCents(product.price)
      let uniquePriceCents = basePriceCents

      while (usedPrices.has(uniquePriceCents)) {
        uniquePriceCents += PRICE_INCREMENT_CENTS
      }

      usedPrices.add(uniquePriceCents)

      return uniquePriceCents === basePriceCents
        ? product
        : { ...product, price: shopCentsToPrice(uniquePriceCents) }
    })
  ))
}

const streamOverlayProducts = sortedImageEntries(overlayImageModules)
  .map(([path, image], index) => {
    const stem = overlayFileStem(path)
    const title = overlayNames[index] || `Leonida Stream Overlay ${index + 1}`

    return {
      id: stem ? `stream-${stem.toLowerCase()}` : `stream-overlay-${index + 1}`,
      categoryId: 'stream-overlays',
      categoryLabel: 'Stream overlays',
      previewLabel: 'Stream overlay preview',
      title,
      image,
      price: title === 'Ocean View Intermission Kit' ? 2.6 : 12 + (index % 4) * 3,
      format: 'PNG pack',
      resolution: '7680 x 4320',
      aspectRatio: streamOverlayAlternateAspectRatioStems.has(stem) ? '1376 / 768' : '1672 / 941',
      downloadUrl: streamOverlayDownloadsByStem[stem],
      downloadFileName: `${stem}-big.png`,
      tags: overlayTags[index] || fallbackOverlayTags[index % fallbackOverlayTags.length],
    }
  })

const profileBannerProducts = sortedImageEntries(profileBannerImageModules)
  .map(([path, image], index) => {
    const stem = overlayFileStem(path)
    const meta = profileBannerMetaByStem[stem]

    return {
      id: stem ? `banner-${stem.toLowerCase()}` : `profile-banner-${index + 1}`,
      categoryId: 'profile-banners',
      categoryLabel: 'Profile banners',
      previewLabel: 'Profile banner preview',
      title: meta?.title || `Leonida Profile Banner ${index + 1}`,
      image,
      price: meta?.price ?? 8 + (index % 3) * 2,
      format: 'Profile banner PNG',
      resolution: '7680 x 3070',
      aspectRatio: profileBannerAspectRatio(stem),
      downloadUrl: profileBannerDownloadsByStem[stem],
      downloadFileName: profileBannerDownloadFileNamesByStem[stem] || `${stem}.jpeg`,
      tags: meta?.tags || profileBannerTags[index % profileBannerTags.length],
    }
  })

const emotePackProducts = sortedEmotePacks()
  .map((pack, index) => {
    const meta = emotePackMeta[pack.folder] || {}

    return {
      id: `emotes-${pack.folder.replace(/_/g, '-')}`,
      categoryId: 'emote-packs',
      categoryLabel: 'Emote packs',
      previewLabel: 'Emote pack preview',
      title: meta.title || `Leonida Emote Pack ${index + 1}`,
      image: pack.previewImage || pack.images[0],
      previewImage: pack.previewImage,
      images: pack.images,
      price: meta.price || 16,
      format: `${pack.images.length} emote PNGs`,
      resolution: '1024 x 1024 each',
      aspectRatio: '16 / 9',
      downloadUrl: emotePackDownloadsByFolder[pack.folder],
      downloadFileName: `${pack.folder}.zip`,
      tags: meta.tags || ['Emote pack', 'Streamer-ready', 'Transparent PNG'],
    }
  })

const uniquelyPricedProductGroups = assignUniqueShopPrices([
  streamOverlayProducts,
  profileBannerProducts,
  emotePackProducts,
])

export const STREAM_OVERLAY_PRODUCTS = uniquelyPricedProductGroups[0]
export const PROFILE_BANNER_PRODUCTS = uniquelyPricedProductGroups[1]
export const EMOTE_PACK_PRODUCTS = uniquelyPricedProductGroups[2]

export const SHOP_PRODUCTS_BY_CATEGORY = {
  'stream-overlays': STREAM_OVERLAY_PRODUCTS,
  'profile-banners': PROFILE_BANNER_PRODUCTS,
  'emote-packs': EMOTE_PACK_PRODUCTS,
}

export const SHOP_PRODUCT_BY_ID = Object.fromEntries(
  Object.values(SHOP_PRODUCTS_BY_CATEGORY)
    .flat()
    .map((product) => [product.id, product]),
)

export function shopProductSlug(product) {
  return slugify(product?.title || product?.id)
}

export const SHOP_PRODUCT_BY_SLUG = Object.fromEntries(
  Object.values(SHOP_PRODUCTS_BY_CATEGORY)
    .flat()
    .map((product) => [shopProductSlug(product), product]),
)

export const SHOP_PRODUCT_ROUTES = Object.values(SHOP_PRODUCTS_BY_CATEGORY)
  .flat()
  .map((product) => `/shop/${shopProductSlug(product)}`)

export function getShopProductThumbnail(product) {
  if (!product) return ''

  return product.previewImage || product.image || product.images?.[0] || ''
}

export const categoryTabs = [
  { id: 'stream-overlays', label: 'Stream overlays', count: STREAM_OVERLAY_PRODUCTS.length, active: true },
  { id: 'profile-banners', label: 'Profile banners', count: PROFILE_BANNER_PRODUCTS.length, active: true },
  { id: 'emote-packs', label: 'Emote packs', count: EMOTE_PACK_PRODUCTS.length, active: true },
]
