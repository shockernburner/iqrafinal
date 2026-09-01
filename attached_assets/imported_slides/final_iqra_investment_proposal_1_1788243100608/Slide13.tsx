import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_41.png";
import img_3 from "./assets/images/image_42.png";
import img_4 from "./assets/images/image_3.png";
import img_5 from "./assets/images/image_8.png";
const Slide13: React.FC = () => {
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
  return <div id="slide-13" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-13" style={{
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
        top: "299px",
        width: "368px",
        height: "219px",
        boxSizing: "border-box",
        borderRadius: "9.13px",
        objectFit: "fill"
      }} /><img key={2} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "456px",
        top: "299px",
        width: "368px",
        height: "219px",
        boxSizing: "border-box",
        borderRadius: "9.13px",
        objectFit: "fill"
      }} /><img key={3} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "848px",
        top: "299px",
        width: "368px",
        height: "219px",
        boxSizing: "border-box",
        borderRadius: "9.13px",
        objectFit: "fill"
      }} /><div key={4} style={{
        position: "absolute",
        left: "55.6px",
        top: "130.65px",
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
          }}>{"3-Year Trajectory to Sustainable Scale"}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "97px",
        top: "332px",
        width: "302px",
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#D4AF37"
          }}>{"YEAR 1 (Minimum)"}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "97px",
        top: "358px",
        width: "317.1px",
        height: "30px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans ExtraBold', 'Plus Jakarta Sans', sans-serif",
            fontWeight: "800",
            color: "#062318"
          }}>{"$250K - $400K"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "489px",
        top: "332px",
        width: "302px",
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#D4AF37"
          }}>{"YEAR 2 (Minimum)"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "489px",
        top: "358px",
        width: "317.1px",
        height: "30px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans ExtraBold', 'Plus Jakarta Sans', sans-serif",
            fontWeight: "800",
            color: "#062318"
          }}>{"$1.2M - $1.8M"}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "881px",
        top: "332px",
        width: "302px",
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: "700",
            color: "#D4AF37"
          }}>{"YEAR 3 (Minimum)"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "881px",
        top: "358px",
        width: "317.1px",
        height: "30px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans ExtraBold', 'Plus Jakarta Sans', sans-serif",
            fontWeight: "800",
            color: "#062318"
          }}>{"$4.5M - $6.5M"}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "118px",
        top: "404px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Core user acquisition"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "118px",
        top: "435.41px",
        width: "281px",
        height: "18.18px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Individual & corporate "}</span><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"donations"}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "118px",
        top: "466px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Initial API developer alpha"}</span></p></div><div key={14} style={{
        position: "absolute",
        left: "510px",
        top: "404px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Launch of premium tools"}</span></p></div><div key={15} style={{
        position: "absolute",
        left: "510px",
        top: "435px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Commercial B2B API contracts"}</span></p></div><div key={16} style={{
        position: "absolute",
        left: "510px",
        top: "466px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"40% reduction in query cost"}</span></p></div><div key={17} style={{
        position: "absolute",
        left: "902px",
        top: "404px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Scale to 1M daily active users"}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "902px",
        top: "435px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Enterprise institution licensing"}</span></p></div><div key={19} style={{
        position: "absolute",
        left: "902px",
        top: "466px",
        width: "281px",
        height: "19px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11.25pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#4A5D55"
          }}>{"Full operational self-sustainability"}</span></p></div><img key={20} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "97px",
        top: "406px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={21} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "97px",
        top: "437px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={22} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "97px",
        top: "468px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={23} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "489px",
        top: "406px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={24} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "489px",
        top: "437px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={25} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "489px",
        top: "468px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={26} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "881px",
        top: "406px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={27} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "881px",
        top: "437px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={28} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "881px",
        top: "468px",
        width: "13px",
        height: "15px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={29} style={{
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
          }}>{"REVENUE PROJECTIONS"}</span></p></div><div key={30} style={{
        position: "absolute",
        left: "55.6px",
        top: "124.42px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><img key={31} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "60px",
        top: "662px",
        width: "1160px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={32} style={{
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
          }}>{"12 / 15"}</span></p></div><div key={33} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={34} src={img_5} alt="Picture 8" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide13;
