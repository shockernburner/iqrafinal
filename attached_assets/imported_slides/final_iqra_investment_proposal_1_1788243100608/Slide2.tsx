import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_1.png";
import img_2 from "./assets/images/image_3.png";
import img_3 from "./assets/images/image_4.png";
import img_4 from "./assets/images/image_5.png";
import img_5 from "./assets/images/image_6.png";
import img_6 from "./assets/images/image_7.png";
import img_7 from "./assets/images/image_8.png";
const Slide2: React.FC = () => {
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
  return <div id="slide-2" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-2" style={{
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
        left: "60px",
        top: "662px",
        width: "1160px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={2} style={{
        position: "absolute",
        left: "368.05px",
        top: "190.5px",
        width: "543.9px",
        height: "53px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(30pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(30pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FBBF24"
          }}>{"INVESTMENT PROPOSAL"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "187.94px",
        top: "521.16px",
        width: "900px",
        height: "115.19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.92",
          fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontStyle: "italic",
            fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#ECFDF5"
          }}>{"Authenticated Islamic knowledge for the age of generative AI"}</span></p></div><div key={4} style={{
        position: "absolute",
        left: "447.94px",
        top: "578.75px",
        width: "380px",
        height: "32px",
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
            color: "#6EE7B7"
          }}>{"SEED ROUND \xB7 2026 \xB7 CONFIDENTIAL"}</span></p></div><div key={5} style={{
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
          }}>{". All rights reserved"}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "1177px",
        top: "678px",
        width: "65.84px",
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
          }}>{"01 / 15"}</span></p></div><img key={7} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "506.5px",
        top: "469.63px",
        width: "115px",
        height: "44px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={8} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "651.5px",
        top: "469.63px",
        width: "122px",
        height: "44px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={9} style={{
        position: "absolute",
        left: "448.36px",
        top: "27.6px",
        width: "374.26px",
        height: "165.33px"
      }}><div key={0} style={{
          position: "absolute",
          left: "0px",
          top: "112.33px",
          width: "374.26px",
          height: "53px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0px 0px 0px 0px",
          whiteSpace: "nowrap",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "center",
            lineHeight: "1.2",
            fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Fraunces', sans-serif",
              fontWeight: "700",
              color: "#F4EFE3",
              letterSpacing: "8.64pt"
            }}>{"IQRA"}</span></p></div><div key={1} style={{
          position: "absolute",
          left: "85.52px",
          top: "0px",
          width: "200.01px",
          height: "128.61px",
          boxSizing: "border-box",
          overflow: "hidden"
        }}><img src={img_5} alt="Picture 4" style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            width: "200.01px",
            height: "202.29px",
            maxWidth: "none"
          }} /></div></div><img key={10} src={img_6} alt="Picture 6" style={{
        position: "absolute",
        left: "517.91px",
        top: "243.5px",
        width: "231.95px",
        height: "231.95px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={11} src={img_7} alt="Picture 3" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide2;
