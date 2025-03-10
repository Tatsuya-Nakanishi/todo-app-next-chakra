import { defineStyle, extendTheme } from '@chakra-ui/react';

// 直接使わないでください
export const primitiveTokens = {
  greyScale: {
    white: '#ffffff',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#c8c8c8',
    400: '#949494',
    500: '#616161',
    600: '#3f3f3f',
    700: '#2a2a2a',
    800: '#1a1a1a',
    black: '#000000',
  },
  navyScale: {
    10: '#f7f8fa',
    50: '#eceff1',
    100: '#cfd8dc',
    300: '#90a4ae',
    500: '#607d8b',
    700: '#455a64',
    900: '#263238',
  },
  pickBlue: {
    100: '#b3e5fc',
    300: '#4ec2f7',
    500: '#03a8f4',
    700: '#0487d1',
    800: '#0476bd',
  },
  pickRed: {
    100: '#ffcdd2',
    300: '#e57373',
    500: '#f44336',
    700: '#d32f2f',
    800: '#c62828',
  },
  pickCyan: {
    100: '#b0eaf4',
    300: '#44cee4',
    500: '#00bad7',
    700: '#0095a9',
    800: '#008191',
  },
  blue: {
    300: '#57c2de',
    500: '#13a9d6',
    800: '#0077a4',
  },
  deepOrange: {
    300: '#ff8965',
    500: '#ff5522',
    800: '#d84115',
  },
  purple: {
    300: '#aa4abd',
    500: '#9b2cb1',
    800: '#691f9b',
  },
  green: {
    300: '#4db6ab',
    500: '#009687',
    800: '#00695b',
  },
  yellow: {
    300: '#ffd54f',
    500: '#ffc107',
    800: '#ff8f00',
  },
  yellowGreen: {
    100: '#4CD964',
  },
  linkText: {
    100: '#3282E2',
  },
  filter: {
    100: '#E8F0FE',
  },
  cyan: {
    100: '#26C6DA',
  },
  gray: {
    100: '#EFF0F2',
    300: '#D3D4D6',
    500: '#D8DBDF',
    700: '#AFB0B2',
  },
  pink: {
    100: '#FFEBEE',
  },
  blueGreen: {
    100: '#03A9F4',
  },
  breadCrumbGray: {
    100: '#B0BEC5',
  },
  brandLightBlue: {
    500: '#DFE1E7',
  },
  dark: {
    100: '#3B4A61',
  },
};

export const colorTokens = {
  blueGreen: primitiveTokens.blueGreen[100],
  linkText: primitiveTokens.linkText[100], // primarySelectedも同じ
  primary: primitiveTokens.pickBlue[500],
  primaryHover: primitiveTokens.pickBlue[300],
  primaryDisabled: primitiveTokens.pickBlue[100],
  danger: primitiveTokens.pickRed[500],
  dangerDisabled: primitiveTokens.pickRed[100],
  dangerHover: primitiveTokens.pickRed[300],
  dangerSelected: primitiveTokens.pickRed[800],
  background: primitiveTokens.navyScale[10],
  border: primitiveTokens.navyScale[300], // 96a8b0-IconButton / tableHead / textLightも同じ
  breadCrumb: primitiveTokens.breadCrumbGray[100], // b0bec5-SecondaryButton / secondaryDisabled / b3bec4-TableHeaderも同じ
  formOutline: primitiveTokens.brandLightBlue[500], // FormOutline / e2e8f0-ファイル選択 / dfe1e7も同じ
  formFill: primitiveTokens.filter[100], // edf2f7-filter / SubButtonも同じ
  textDark: primitiveTokens.dark[100], // outline / secondary / secondarySelectedも同じ
  white: primitiveTokens.greyScale.white, // textWhite / tableDataも同じ
  fileSelection: primitiveTokens.navyScale[10],
  textDarkHover: primitiveTokens.navyScale[500], // #718096 / secondaryHover / gurantorColor / otherColor / 718096-TextSecondaryも同じ
  notice: primitiveTokens.yellowGreen[100],
  userColor: primitiveTokens.deepOrange[500],
  managerColor: primitiveTokens.green[500],
  mediatorColor: primitiveTokens.purple[500],
  realEstateColor: primitiveTokens.yellow[500],
  textDarkDisabled: primitiveTokens.navyScale[100], // secondaryDisabledも同じ
  ownerColor: primitiveTokens.blue[500],
  cyan: primitiveTokens.cyan[100],
  baseGray: primitiveTokens.greyScale[300],
  tableHover: primitiveTokens.greyScale[200],
  btnPrimary: primitiveTokens.pickBlue[500],
  btnPrimaryHover: primitiveTokens.pickBlue[300],
  btnPrimaryPressed: primitiveTokens.pickBlue[700],
  btnPrimaryDisable: primitiveTokens.pickBlue[100],
  btnSecondary: primitiveTokens.pickBlue[500],
  btnSecondaryBg: primitiveTokens.greyScale.white, // hover / pressed / disableも同じ
  btnSecondaryHover: primitiveTokens.pickBlue[300],
  btnSecondaryPressed: primitiveTokens.pickBlue[700],
  btnSecondaryDisable: primitiveTokens.pickBlue[100],
  btnDanger: primitiveTokens.pickRed[500], // hover / pressedも同じ
  btnDangerBg: primitiveTokens.greyScale.white,
  btnDangerHoverBg: primitiveTokens.pink[100],
  btnDangerPressedBg: primitiveTokens.pickRed[100],
  btnDangerDisable: primitiveTokens.pickRed[100],
  btnDangerDisableBg: primitiveTokens.greyScale.white,
  btnInfo: primitiveTokens.navyScale[300], // hover / pressed同じ
  btnInfoBg: primitiveTokens.greyScale.white,
  btnInfoHoverBg: primitiveTokens.gray[100],
  btnInfoPressedBg: primitiveTokens.gray[300],
  btnInfoDisable: primitiveTokens.gray[300],
  btnInfoDisableBg: primitiveTokens.greyScale.white,
  readCrumbsHover: primitiveTokens.gray[300],
  readCrumbsPressed: primitiveTokens.gray[700],
  btnIcon: primitiveTokens.navyScale[300], //  hover / pressed同じ
  btnIconBg: primitiveTokens.greyScale.white,
  btnIconHoverBg: primitiveTokens.gray[100],
  btnIconPressedBg: primitiveTokens.gray[300],
  btnIconDisableBg: primitiveTokens.greyScale.white,
  btnIconDisable: primitiveTokens.gray[500],
  badgePro: 'linear-gradient(140.15deg, #3282E2 11.78%, rgba(119, 117, 250, 0) 85.56%)',
  generic: '#3E9F53',
  reexplanation: '#0487D1',
  approval: '#2D9AFF',
};

enum ThumbnailSize {
  Base = 'base',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export const sizeTokens = {
  lpThumbnailSize: {
    width: {
      [ThumbnailSize.Base]: '343',
      [ThumbnailSize.Sm]: '416',
      [ThumbnailSize.Md]: '489',
      [ThumbnailSize.Lg]: '770',
      [ThumbnailSize.Xl]: '1000',
    },
    height: {
      [ThumbnailSize.Base]: '193',
      [ThumbnailSize.Sm]: '234',
      [ThumbnailSize.Md]: '275',
      [ThumbnailSize.Lg]: '430',
      [ThumbnailSize.Xl]: '600',
    },
  },
};

export const theme = extendTheme({
  styles: {
    global: {
      body: {
        color: '#2d3748',
      },
    },
  },
  zIndices: {
    // extendTheme URL: https://chakra-ui.com/docs/styled-system/theme#z-index-values
    signItems: 100,
  },
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
    },
    IconButton: {
      baseStyle: {
        _focus: {
          boxShadow: 'none',
        },
      },
    },
    Checkbox: {
      baseStyle: {
        control: {
          _checked: {
            bg: '#03A9F4',
            borderColor: '#03A9F4',

            _hover: {
              bg: '#03A9F4',
              borderColor: '#03A9F4',
            },
          },
          _focus: {
            boxShadow: '0px 0px 0px 3px',
          },
        },
      },
      sizes: {
        xl: {
          control: {
            boxSize: 6,
          },
          label: {
            fontSize: 'sm',
            marginLeft: 2,
          },
        },
      },
    },
    Tooltip: {
      sizes: {
        lg: defineStyle({
          p: '4',
          maxW: '500px',
        }),
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          width: '100%',
          margin: 'auto 0',
        },
        header: {
          fontSize: '20px',
        },
        closeButton: {
          // Figma上は24pxだが、closeボタン自体の余白もあるので調整
          top: '16px',
          right: '16px',
        },
      },
      sizes: {
        base: {
          dialog: {
            maxWidth: { md: '552px' },
          },
        },
        md: {
          dialog: {
            maxWidth: { md: '680px' },
          },
        },
        lg: {
          dialog: { maxWidth: { md: '800px' } },
        },
        xl: {
          dialog: {
            width: { md: '85%' },
            maxWidth: { md: '1200px' },
          },
          header: {
            fontSize: { base: '24px', md: '30px' },
          },
        },
      },
    },
  },
  colors: {
    // TODO: 削除予定
    brandGreen: {
      50: '#74edff',
      100: '#41e6ff',
      200: '#1fe2ff',
      300: '#00dbfc',
      400: '#00beda',
      500: '#03A9F4',
      600: '#008296',
      700: '#3B4A61',
      800: '#004752',
    },
    brandBlue: {
      500: '#03A9F4', // standard
      600: '#4EC2F7', // hover
      700: '#0487D1', // pressed
    },
    brandLightBlue: {
      500: '#DFE1E7',
    },
    brandGray: {
      500: '#707070', // standard
      600: '#718096', // hover
    },
    brandLightGray: {
      500: '#B0BEC5', // standard
      600: '#9ECBEF', // hover
    },
    grayText: {
      500: '#898989',
    },
    noticeBg: {
      500: 'rgba(223, 66, 94, 0.2)',
    },
    noticeText: {
      500: '#F44336',
    },
    ...colorTokens,
  },
  sizes: {
    ...sizeTokens,
  },
});