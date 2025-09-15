import { AfterMathContract } from "./aftermath/index.js";
import { BluefinContract } from "./bluefin/index.js";
import { BluefinXContract } from "./bluefinx/index.js";
import { BluemoveContract } from "./bluemove/index.js";
import { CetusContract } from "./cetus/index.js";
import { SponsoredDeepBookV3Contract } from "./deepbookV3/sponsored.js";
import { FlowXContract } from "./flowx/index.js";
import { FlowxV3Contract } from "./flowxV3/index.js";
import { FullsailContract } from "./fullsail/index.js";
import { HaedalPMMContract } from "./haedal_pmm/index.js";
import { KriyaContract } from "./kriya/index.js";
import { KriyaV3Contract } from "./kriyaV3/index.js";
import { MagmaContract } from "./magma/index.js";
import { MomentumContract } from "./momentum/index.js";
import { ObricContract } from "./obric/index.js";
import { SevenKV1 } from "./sevenk/index.js";
import { SpringSuiContract } from "./springsui/index.js";
import { SteammContract } from "./steamm/index.js";
import { StSuiContract } from "./stsui/index.js";
import { SuiswapContract } from "./suiswap/index.js";
import { TurbosContract } from "./turbos/index.js";

export const ProtocolContract = {
  cetus: CetusContract,
  turbos: TurbosContract,
  bluemove: BluemoveContract,
  kriya: KriyaContract,
  suiswap: SuiswapContract,
  aftermath: AfterMathContract,
  deepbook_v3: SponsoredDeepBookV3Contract,
  flowx: FlowXContract,
  flowx_v3: FlowxV3Contract,
  kriya_v3: KriyaV3Contract,
  bluefin: BluefinContract,
  springsui: SpringSuiContract,
  obric: ObricContract,
  stsui: StSuiContract,
  steamm: SteammContract,
  steamm_oracle_quoter: SteammContract,
  steamm_oracle_quoter_v2: SteammContract,
  magma: MagmaContract,
  haedal_pmm: HaedalPMMContract,
  momentum: MomentumContract,
  bluefinx: BluefinXContract,
  sevenk_v1: SevenKV1,
  fullsail: FullsailContract,
};
