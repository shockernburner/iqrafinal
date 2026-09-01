import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_3.png";
import img_3 from "./assets/images/image_8.png";
const Slide3: React.FC = () => {
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
  return <div id="slide-3" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-3" style={{
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
        width: "59.65px",
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
          }}>{"02 / 1"}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"5"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "60px",
        top: "263.66px",
        width: "1160px",
        height: "291.75px"
      }}><div key={0} style={{
          position: "absolute",
          left: "70px",
          top: "5px",
          width: "1090px",
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
            }}>{"General AI answers faith questions probabilistically, producing unverifiable rulings"}</span></p></div><div key={1} style={{
          position: "absolute",
          left: "70px",
          top: "65.19px",
          width: "1090px",
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
            }}>{"IQRA is a live assistant that anchors every answer in authenticated sources and a verified chain of transmission"}</span></p></div><div key={2} style={{
          position: "absolute",
          left: "70px",
          top: "125.38px",
          width: "1090px",
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
            }}>{"The market: 2 billion Muslims and a $2.4 trillion Islamic economy"}</span></p></div><div key={3} style={{
          position: "absolute",
          left: "70px",
          top: "185.56px",
          width: "1090px",
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
            }}>{"The model scales from donations to premium tooling to B2B licensing"}</span></p></div><div key={4} style={{
          position: "absolute",
          left: "70px",
          top: "245.75px",
          width: "1090px",
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
            }}>{"The ask: $2.5M to reach 1M daily users and B2B revenue within 24 months"}</span></p></div><div key={5} style={{
          position: "absolute",
          left: "0px",
          top: "0px",
          width: "33px",
          height: "51px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display', sans-serif",
              fontWeight: "700",
              color: "#FBBF24"
            }}>{"01"}</span></p></div><div key={6} style={{
          position: "absolute",
          left: "0px",
          top: "60.19px",
          width: "38px",
          height: "51px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display', sans-serif",
              fontWeight: "700",
              color: "#FBBF24"
            }}>{"02"}</span></p></div><div key={7} style={{
          position: "absolute",
          left: "0px",
          top: "120.38px",
          width: "37px",
          height: "51px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display', sans-serif",
              fontWeight: "700",
              color: "#FBBF24"
            }}>{"03"}</span></p></div><div key={8} style={{
          position: "absolute",
          left: "0px",
          top: "180.56px",
          width: "38px",
          height: "51px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display', sans-serif",
              fontWeight: "700",
              color: "#FBBF24"
            }}>{"04"}</span></p></div><div key={9} style={{
          position: "absolute",
          left: "0px",
          top: "240.75px",
          width: "36px",
          height: "51px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display', sans-serif",
              fontWeight: "700",
              color: "#FBBF24"
            }}>{"05"}</span></p></div></div><div key={4} style={{
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
          }}>{"EXECUTIVE SUMMARY"}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "60px",
        top: "132px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={6} style={{
        position: "absolute",
        left: "60px",
        top: "174px",
        width: "946.45px",
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
          }}>{"IQRA is a live, source-grounded Islamic assistant raising $2.5M to reach scale"}</span></p></div><div key={7} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={8} src={img_3} alt="Picture 5" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide3;
