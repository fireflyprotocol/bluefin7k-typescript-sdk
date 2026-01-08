import { AfterMathContract } from "./aftermath/index";
import { BluefinContract } from "./bluefin/index";
import { BluefinXContract } from "./bluefinx/index";
import { BluefinXV2Contract } from "./bluefinxV2/index";
import { BluemoveContract } from "./bluemove/index";
import { CetusContract } from "./cetus/index";
import { CetusDLMMContract } from "./cetus_dlmm";
import { FerraCLMMContract } from "./ferra_clmm";
import { FerraDLMMContract } from "./ferra_dlmm";
import { SponsoredDeepBookV3Contract } from "./deepbookV3/sponsored";
import { FlowXContract } from "./flowx/index";
import { FlowxV3Contract } from "./flowxV3/index";
import { FullsailContract } from "./fullsail/index";
import { HaedalPMMContract } from "./haedal_pmm/index";
import { KriyaContract } from "./kriya/index";
import { KriyaV3Contract } from "./kriyaV3/index";
import { MagmaContract } from "./magma/index";
import { MomentumContract } from "./momentum/index";
import { ObricContract } from "./obric/index";
import { SevenKV1 } from "./sevenk/index";
import { SpringSuiContract } from "./springsui/index";
import { SteammContract } from "./steamm/index";
import { StSuiContract } from "./stsui/index";
import { SuiswapContract } from "./suiswap/index";
import { TurbosContract } from "./turbos/index";

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
  RFQ: BluefinXV2Contract,
  sevenk_v1: SevenKV1,
  fullsail: FullsailContract,
  cetus_dlmm: CetusDLMMContract,
  ferra_dlmm: FerraDLMMContract,
  ferra_clmm: FerraCLMMContract,
};
