import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_32.png";
import img_3 from "./assets/images/image_3.png";
import img_4 from "./assets/images/image_33.png";
import img_5 from "./assets/images/image_34.png";
import img_6 from "./assets/images/image_35.png";
import img_7 from "./assets/images/image_8.png";
const Slide9: React.FC = () => {
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
  return <div id="slide-9" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-9" style={{
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
        top: "596.8px",
        width: "1160px",
        height: "42.65px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#34D399"
          }}>{"Milestone path: live product \u2192 engaged base \u2192 1M daily users as the funded 24-month goal "}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#34D399"
          }}>{"(target, not current)"}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "1177px",
        top: "678px",
        width: "53.45px",
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
          }}>{"08 / 15"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "159.67px",
        top: "374.8px",
        width: "160.65px",
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
          }}>{"Community"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "91px",
        top: "426.8px",
        width: "298px",
        height: "116.33px",
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
          }}>{"Mosque, university, and scholar networks; shareable, source-cited answers"}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "540.25px",
        top: "374.8px",
        width: "199.5px",
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
          }}>{"Product Depth"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "491px",
        top: "426.8px",
        width: "298px",
        height: "64px",
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
          }}>{"Premium tools convert engaged users; PWA install lowers friction."}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "952.32px",
        top: "374.8px",
        width: "175.35px",
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
          }}>{"Partnerships"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "891px",
        top: "426.8px",
        width: "298px",
        height: "64px",
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
          }}>{"Islamic institutions and libraries drive credibility and distribution."}</span></p></div><img key={13} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "208.5px",
        top: "294.8px",
        width: "63px",
        height: "50px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={14} src={img_5} alt="image.png" style={{
        position: "absolute",
        left: "612px",
        top: "294.8px",
        width: "56px",
        height: "50px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={15} src={img_6} alt="image.png" style={{
        position: "absolute",
        left: "1008.5px",
        top: "294.8px",
        width: "63px",
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
          }}>{"GROWTH"}</span></p></div><div key={17} style={{
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
        width: "792.65px",
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
          }}>{"Reaching one million daily users runs on three growth engines"}</span></p></div><div key={19} style={{
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
export default Slide9;
