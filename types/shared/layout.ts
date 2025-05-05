interface LayoutLink {
  label: string;
  path: string;
  openBlank: boolean;
}

export type HeaderLink = LayoutLink;
export type FooterLink = LayoutLink;

export interface FooterLinkGroup {
  group: number;
  links: FooterLink[];
}
