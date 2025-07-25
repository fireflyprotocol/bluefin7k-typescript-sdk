import { fetchClient } from "../../config/fetchClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { Config } from "../../types/aggregator";

export const DEFAULT_CONFIG: Config = {
  aftermath: {
    name: "Aftermath",
    package:
      "0xc4049b2d1cc0f6e017fda8260e4377cecd236bd7f56a54fee120816e72e2e0dd",
    poolRegistry:
      "0xfcc774493db2c45c79f688f88d28023a3e7d98e4ee9f48bbf5c7990f651577ae",
    protocolFeeVault:
      "0xf194d9b1bcad972e45a7dd67dd49b3ee1e3357a00a50850c52cd51bb450e13b4",
    treasury:
      "0x28e499dff5e864a2eafe476269a4f5035f1c16f338da7be18b103499abf271ce",
    insuranceFund:
      "0xf0c40d67b078000e18032334c3325c47b9ec9f3d9ae4128be820d54663d14e3b",
    referralVault:
      "0x35d35b0e5b177593d8c3a801462485572fc30861e6ce96a55af6dc4730709278",
  },
  bluefin: {
    name: "Bluefin",
    package:
      "0x67b34b728c4e28e704dcfecf7c5cf55c7fc593b6c65c20d1836d97c209c1928a",
    globalConfig:
      "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352",
  },
  bluemove: {
    name: "Bluemove",
    package:
      "0x08cd33481587d4c4612865b164796d937df13747d8c763b8a178c87e3244498f",
    dexInfo:
      "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92",
  },
  cetus: {
    name: "Cetus",
    package:
      "0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d",
    globalConfig:
      "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
  },
  deepbook_v3: {
    name: "Deepbook V3",
    package: "",
    sponsor:
      "0x951a01360d85b06722edf896852bf8005b81cdb26375235c935138987f629502",
    sponsorFund:
      "0xf245e7a4b83ed9a26622f5818a158c2ba7a03b91e62717b557a7df1d4dab38df",
  },
  flowx: {
    name: "Flowx Finance",
    package:
      "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0",
    container:
      "0xb65dcbf63fd3ad5d0ebfbf334780dc9f785eff38a4459e37ab08fa79576ee511",
  },
  flowx_v3: {
    name: "Flowx Finance V3",
    package:
      "0xe882cd54551e73e64ff5b257146a0c5264546974cf00d78ecc871017cb22df67",
    registry:
      "0x27565d24a4cd51127ac90e4074a841bbe356cca7bf5759ddc14a975be1632abc",
    version:
      "0x67624a1533b5aff5d0dfcf5e598684350efd38134d2d245f475524c03a64e656",
  },
  kriya: {
    name: "Kriya",
    package:
      "0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66",
  },
  kriya_v3: {
    name: "Kriya V3",
    package:
      "0x0d7305a7475ed54adc905365bd081939a81926636b4c438cf2f75f4924b8d960",
    version:
      "0xf5145a7ac345ca8736cf8c76047d00d6d378f30e81be6f6eb557184d9de93c78",
  },
  obric: {
    name: "Obric",
    package:
      "0xb84e63d22ea4822a0a333c250e790f69bf5c2ef0c63f4e120e05a6415991368f",
    pythState:
      "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8",
  },
  springsui: {
    name: "SpringSui",
    package:
      "0x82e6f4f75441eae97d2d5850f41a09d28c7b64a05b067d37748d471f43aaf3f7",
  },
  stsui: {
    name: "AlphaFi stSUI",
    package:
      "0x059f94b85c07eb74d2847f8255d8cc0a67c9a8dcc039eabf9f8b9e23a0de2700",
  },
  suiswap: {
    name: "SuiSwap",
    package:
      "0xd075d51486df71e750872b4edf82ea3409fda397ceecc0b6aedf573d923c54a0",
  },
  turbos: {
    name: "Turbos Finance",
    package:
      "0xd02012c71c1a6a221e540c36c37c81e0224907fe1ee05bfe250025654ff17103",
    version:
      "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f",
  },
  steamm: {
    name: "Steamm",
    package:
      "0x4454d95507deb17d5017db11105bd95027d434776af1d0049ce27a3510a9a1ba",
    script:
      "0xbef015f8fe24f324cc4a7939a88c164e78d2d859aa925a75bd8f8472b6ae7d0e",
    oracle:
      "0xe84b649199654d18c38e727212f5d8dacfc3cf78d60d0a7fc85fd589f280eb2b",
  },
  magma: {
    name: "Magma",
    package:
      "0x49e9f06c58a36830fe0d83291f002012e72b00a4ec9b3a6304c40fc5712bb6e3",
    globalConfig:
      "0x4c4e1402401f72c7d8533d0ed8d5f8949da363c7a3319ccef261ffe153d32f8a",
  },
  haedal_pmm: {
    name: "Haedal PMM",
    package:
      "0xa0e3b011012b80af4957afa30e556486eb3da0a7d96eeb733cf16ccd3aec32e0",
  },
  momentum: {
    name: "Momentum",
    package:
      "0xc84b1ef2ac2ba5c3018e2b8c956ba5d0391e0e46d1daa1926d5a99a6a42526b4",
    version:
      "0x2375a0b1ec12010aaea3b2545acfa2ad34cfbba03ce4b59f4c39e1e25eed1b2a",
  },
  bluefinx: {
    name: "BluefinX",
    package:
      "0xf8870f988ab09be7c5820a856bd5e9da84fc7192e095a7a8829919293b00a36c",
    globalConfig:
      "0xc6b29a60c3924776bedc78df72c127ea52b86aeb655432979a38f13d742dedaa",
  },
  sevenk_v1: {
    name: "7K DEX",
    package:
      "0x4142285db093ba0cf0623b3cbc07372fb4f5ed00af1fb62be6d55f49a42c0b0e",
    oracle:
      "0x8c36ea167c5e6da8c3d60b4fc897416105dcb986471bd81cfbfd38720a4487c0",
  },
};

let config: Config | null = DEFAULT_CONFIG;
let configTs: number = 0;
export async function getConfig(
  swapViaPartner:
    | {
        partnerAddress: string;
        feePercentage1e6: number;
      }
    | undefined = undefined
) {
  const ttl = 60;
  if (config && Date.now() - configTs < ttl * 1000) {
    return config;
  }

  try {
    const response = await fetchClient(`${API_ENDPOINTS.MAIN}/config`);
    const quoteResponse = (await response.json()) as Config;
    config = {
      ...config,
      ...quoteResponse,
      swapViaPartner: swapViaPartner || undefined,
      bluefinx: {
        name: "BluefinX",
        package:
          "0x9633d611ea4b3a30751135cede2c7871980955473c1c7c883d43567e7e9b164e",
        globalConfig:
          "0xc6b29a60c3924776bedc78df72c127ea52b86aeb655432979a38f13d742dedaa",
      },
    };
    configTs = Date.now();
    return config;
  } catch (_) {
    return DEFAULT_CONFIG;
  }
}
