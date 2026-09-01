import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_43.png";
import img_3 from "./assets/images/image_44.png";
import img_4 from "./assets/images/image_45.png";
import img_5 from "./assets/images/image_46.png";
import img_6 from "./assets/images/image_47.png";
import img_7 from "./assets/images/image_48.png";
import img_8 from "./assets/images/image_49.png";
import img_9 from "./assets/images/image_3.png";
import img_10 from "./assets/images/image_8.png";
const Slide14: React.FC = () => {
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
  return <div id="slide-14" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-14" style={{
      position: "absolute",
      width: "1280px",
      height: "720px",
      overflow: "hidden",
      transformOrigin: "top left",
      color: "#000000",
      backgroundColor: "#ffffff",
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
        left: "64px",
        top: "287px",
        width: "368px",
        height: "243px",
        boxSizing: "border-box",
        borderRadius: "10.13px",
        objectFit: "fill"
      }} /><img key={2} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "456px",
        top: "287px",
        width: "368px",
        height: "243px",
        boxSizing: "border-box",
        borderRadius: "10.13px",
        objectFit: "fill"
      }} /><img key={3} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "848px",
        top: "287px",
        width: "368px",
        height: "243px",
        boxSizing: "border-box",
        borderRadius: "10.13px",
        objectFit: "fill"
      }} /><div key={4} style={{
        position: "absolute",
        left: "55.6px",
        top: "132.66px",
        width: "1209.6px",
        height: "45px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans ExtraBold', 'Plus Jakarta Sans', sans-serif",
            fontWeight: "800",
            color: "#ffffff"
          }}>{"Risk-Adjusted Returns & Strategic Value"}</span></p></div><img key={5} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "97px",
        top: "320px",
        width: "48px",
        height: "48px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={6} style={{
        position: "absolute",
        left: "97px",
        top: "388px",
        width: "317.1px",
        height: "25px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#062318"
          }}>{"Equity Appreciation"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "97px",
        top: "425px",
        width: "302px",
        height: "72px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.8",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Targeting 5x to 8x valuation multiple expansion over 5 years driven by B2B SaaS recurring revenue."}</span></p></div><img key={8} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "489px",
        top: "320px",
        width: "48px",
        height: "48px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={9} style={{
        position: "absolute",
        left: "489px",
        top: "388px",
        width: "317.1px",
        height: "25px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#062318"
          }}>{"Dividend / Profit Share"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "489px",
        top: "425px",
        width: "302px",
        height: "72px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.8",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Ethical hybrid model allowing cash-flow distributions once sustainable surplus is achieved in Year 3+."}</span></p></div><img key={11} src={img_5} alt="image.png" style={{
        position: "absolute",
        left: "881px",
        top: "320px",
        width: "48px",
        height: "48px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={12} style={{
        position: "absolute",
        left: "881px",
        top: "388px",
        width: "317.1px",
        height: "25px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#062318"
          }}>{"Impact & Legacy"}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "881px",
        top: "425px",
        width: "302px",
        height: "72px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.8",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Unprecedented strategic foothold in safeguarding verified Islamic knowledge infrastructure globally."}</span></p></div><img key={14} src={img_6} alt="image.png" style={{
        position: "absolute",
        left: "109.5px",
        top: "334px",
        width: "23px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={15} src={img_7} alt="image.png" style={{
        position: "absolute",
        left: "501.5px",
        top: "334px",
        width: "23px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={16} src={img_8} alt="image.png" style={{
        position: "absolute",
        left: "895px",
        top: "334px",
        width: "20px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={17} style={{
        position: "absolute",
        left: "55.6px",
        top: "57.58px",
        width: "1218px",
        height: "55.74px",
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
          }}>{"INVESTOR ROI OUTLOOK"}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "55.6px",
        top: "124.42px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><img key={19} src={img_9} alt="image.png" style={{
        position: "absolute",
        left: "60px",
        top: "662px",
        width: "1160px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={20} style={{
        position: "absolute",
        left: "1177px",
        top: "678px",
        width: "63px",
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
          }}>{"13 / 15"}</span></p></div><div key={21} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={22} src={img_10} alt="Picture 10" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide14;
