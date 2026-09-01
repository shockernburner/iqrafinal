import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_3.png";
import img_3 from "./assets/images/image_40.png";
import img_4 from "./assets/images/image_8.png";
const Slide12: React.FC = () => {
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
  return <div id="slide-12" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-12" style={{
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
        top: "662px",
        width: "1160px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={2} style={{
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
          }}>{"11 / 15"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "110px",
        top: "294.06px",
        width: "1110px",
        height: "35.19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#D1FAE5"
          }}>{"~24 months of runway"}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{" to hit the milestones investors underwrite."}</span></p></div><div key={4} style={{
        position: "absolute",
        left: "110px",
        top: "354.25px",
        width: "1110px",
        height: "42.65px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Funds the jump from "}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"3,00,000"}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"+ to 10,00,000 authenticated sources \u2014 "}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#D1FAE5"
          }}>{"the core defensibility."}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "110px",
        top: "414.44px",
        width: "1110px",
        height: "35.19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Targets a "}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#D1FAE5"
          }}>{"~40% reduction in cost per query"}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{" as knowledge confidence rises."}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "110px",
        top: "474.63px",
        width: "1110px",
        height: "35.19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Stands up the "}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#D1FAE5"
          }}>{"B2B API alpha"}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{" that opens high-margin recurring revenue in Year 2+."}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "110px",
        top: "534.81px",
        width: "1110px",
        height: "35.19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "700",
            color: "#D1FAE5"
          }}>{"Right-sized:"}</span><span style={{
            fontSize: "calc(16.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{" enough to reach scale and B2B, small enough to keep the round efficient."}</span></p></div><img key={8} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "312.92px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={9} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "373.11px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={10} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "433.3px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={11} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "493.48px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={12} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "553.67px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={13} style={{
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
          }}>{"JUSTIFICATION"}</span></p></div><div key={14} style={{
        position: "absolute",
        left: "60px",
        top: "132px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={15} style={{
        position: "absolute",
        left: "60px",
        top: "174px",
        width: "829.14px",
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
          }}>{"The raise funds a clear path from live product to recurring revenue"}</span></p></div><div key={16} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={17} src={img_4} alt="Picture 4" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide12;
