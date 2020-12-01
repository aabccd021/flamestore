import { ProjectConfiguration } from "../../type";

export async function createDynamicLink(
  collectionName: string,
  id: string,
  socialTitle?: string,
  socialDescription?: string,
  socialImageLink?: string
) {
  const dynamicLinkInfo: DynamicLinkInfo = {
    dynamicLinkInfo: {
      domainUriPrefix: `https://${project.dynamicLinkDomain}`,
      link: `https://${project.domain}/${collectionName}/${id}`,
      androidInfo: {
        androidPackageName: project.androidPackageName,
      },
      socialMetaTagInfo: {
        socialTitle,
        socialDescription,
        socialImageLink,
      }
    }
  }
  removeEmpty(dynamicLinkInfo);
  const url = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${project.apiKey}`
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const opts: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(dynamicLinkInfo),
  }
  await fetch(url, opts)
}

export interface DynamicLinkInfo {
  dynamicLinkInfo: {
    domainUriPrefix: string,
    link: string,
    androidInfo?: {
      androidPackageName: string,
      androidFallbackLink?: string,
      androidMinPackageVersionCode?: string
    },
    iosInfo?: {
      iosBundleId?: string,
      iosFallbackLink?: string,
      iosCustomScheme?: string,
      iosIpadFallbackLink?: string,
      iosIpadBundleId?: string,
      iosAppStoreId?: string
    },
    navigationInfo?: {
      enableForcedRedirect: boolean,
    },
    analyticsInfo?: {
      googlePlayAnalytics?: {
        utmSource?: string,
        utmMedium?: string,
        utmCampaign?: string,
        utmTerm?: string,
        utmContent?: string,
        gclid?: string
      },
      itunesConnectAnalytics?: {
        at?: string,
        ct?: string,
        mt?: string,
        pt?: string
      }
    },
    socialMetaTagInfo?: {
      socialTitle?: string,
      socialDescription?: string,
      socialImageLink?: string
    }
  },
  suffix?: { option: "SHORT" | "UNGUESSABLE" }
}

const removeEmpty = (obj: any) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === "object") removeEmpty(obj[key]); // recurse
    else if (obj[key] == null) delete obj[key]; // delete
  });
};
