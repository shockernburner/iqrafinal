import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_32.png";
import img_3 from "./assets/images/image_3.png";
import img_4 from "./assets/images/image_36.png";
import img_5 from "./assets/images/image_37.png";
import img_6 from "./assets/images/image_38.png";
import img_7 from "./assets/images/image_8.png";
const Slide10: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    s: 1,
    x: 0,
    y: 0
  });
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / 1280, h / 720);
      setLayout({
        s,
        x: (w - 1280 * s) / 2,
        y: (h - 720 * s) / 2
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div id="slide-10" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-10" style={{
      position: "absolute",
      width: "1280px",
      height: "720px",
      overflow: "hidden",
      transformOrigin: "top left",
      color: "#FFFFFF",
      backgroundColor: "#022C22",
      transform: `scale(${layout.s})`,
      left: layout.x + "px",
      top: layout.y + "px"
    }}><img key={0} src={img_1} alt="image.png" style={{
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1280px",
        height: "720px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={1} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "60px",
        top: "248.8px",
        width: "360px",
        height: "330px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={2} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "460px",
        top: "248.8px",
        width: "360px",
        height: "330px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={3} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "860px",
        top: "248.8px",
        width: "360px",
        height: "330px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={4} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "60px",
        top: "662px",
        width: "1160px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={5} style={{
        position: "absolute",
        left: "60px",
        top: "622.61px",
        width: "1160px",
        height: "22.39px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.919",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Source: Pew Research Center (regional distribution)."}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "1177px",
        top: "678px",
        width: "61.71px",
        height: "16.96px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"09 / 15"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "165.97px",
        top: "374.8px",
        width: "148.05px",
        height: "37px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FEF3C7"
          }}>{"Knowledge"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "91px",
        top: "421.64px",
        width: "298px",
        height: "155.1px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.92",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"From 3,00,000+ page documents toward 10,00,000 authenticated primary sources via library partnerships."}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "575.42px",
        top: "374.8px",
        width: "129.15px",
        height: "37px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FEF3C7"
          }}>{"Language"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "491px",
        top: "418.54px",
        width: "298px",
        height: "155.1px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.92",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Extend beyond English to Arabic, Urdu, and Bahasa to local dialect\u2014 60% of Muslims live in Asia-Pacific."}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "992.75px",
        top: "374.8px",
        width: "94.5px",
        height: "37px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FEF3C7"
          }}>{"Market"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "891px",
        top: "426.8px",
        width: "298px",
        height: "96px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.92",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Consumer app first, then B2B API and compliance tooling for the Halal economy."}</span></p></div><img key={13} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "218px",
        top: "294.8px",
        width: "44px",
        height: "50px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={14} src={img_5} alt="image.png" style={{
        position: "absolute",
        left: "608.5px",
        top: "294.8px",
        width: "63px",
        height: "50px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={15} src={img_6} alt="image.png" style={{
        position: "absolute",
        left: "1015px",
        top: "294.8px",
        width: "50px",
        height: "50px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={16} style={{
        position: "absolute",
        left: "60px",
        top: "60px",
        width: "1218px",
        height: "64px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(34.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(34.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FBBF24"
          }}>{"EXPANSION"}</span></p></div><div key={17} style={{
        position: "absolute",
        left: "60px",
        top: "132px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={18} style={{
        position: "absolute",
        left: "60px",
        top: "174px",
        width: "810.19px",
        height: "54.29px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.919",
          fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#A7F3D0"
          }}>{"Expansion advances across knowledge, language, and market"}</span></p></div><div key={19} style={{
        position: "absolute",
        left: "162.19px",
        top: "682px",
        width: "308.05px",
        height: "17px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{" 2026 "}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"Iqra.live"}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{" & "}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"iqra.chat"}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{". All rights reserved"}</span></p></div><img key={20} src={img_7} alt="Picture 4" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide10;
