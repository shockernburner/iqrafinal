import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_50.png";
import img_2 from "./assets/images/image_3.png";
import img_3 from "./assets/images/image_51.png";
import img_4 from "./assets/images/image_52.png";
import img_5 from "./assets/images/image_53.png";
import img_6 from "./assets/images/image_54.png";
import img_7 from "./assets/images/image_8.png";
const Slide15: React.FC = () => {
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
  return <div id="slide-15" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-15" style={{
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
        left: "31px",
        top: "60px",
        width: "1218px",
        height: "67px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(37.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(37.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#ECFDF5"
          }}>{"CONFIDENTIAL"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "31px",
        top: "157px",
        width: "1218px",
        height: "64.62px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(40pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(40pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FBBF24"
          }}>{"Investing in the integrity of Islamic knowledge"}</span></p></div><div key={4} style={{
        position: "absolute",
        left: "60px",
        top: "222.81px",
        width: "1160px",
        height: "44.8px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.919",
          fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontStyle: "italic",
            fontSize: "calc(21pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#D1FAE5"
          }}>{"The defensible position in authenticated Islamic AI"}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "1177px",
        top: "671.14px",
        width: "72px",
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
          }}>{"14 / "}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"15"}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "439.5px",
        top: "297.08px",
        width: "401px",
        height: "323.78px"
      }}><img key={0} src={img_3} alt="image.png" style={{
          position: "absolute",
          left: "0px",
          top: "0px",
          width: "401px",
          height: "323.78px",
          boxSizing: "border-box",
          objectFit: "fill"
        }} /><div key={1} style={{
          position: "absolute",
          left: "41px",
          top: "41px",
          width: "334.95px",
          height: "40px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.2",
            fontSize: "calc(22.5pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(22.5pt * var(--pptx-font-scale, 1))",
              fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
              fontWeight: "600",
              color: "#FBBF24"
            }}>{"Shaikh Javed Mahmood"}</span></p></div><div key={2} style={{
          position: "absolute",
          left: "41px",
          top: "86px",
          width: "319px",
          height: "32px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 0px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
              fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
              fontWeight: "700",
              color: "#6EE7B7"
            }}>{"FOUNDER & CEO"}</span></p></div><div key={3} style={{
          position: "absolute",
          left: "41px",
          top: "138px",
          width: "319px",
          height: "41.59px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 35px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
              fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
              color: "#D1FAE5"
            }}>{"Iqra.live"}</span></p></div><div key={4} style={{
          position: "absolute",
          left: "41px",
          top: "189.59px",
          width: "319px",
          height: "41.59px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 35px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
              fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
              color: "#D1FAE5"
            }}>{"contact@iqra.live"}</span></p></div><div key={5} style={{
          position: "absolute",
          left: "41px",
          top: "241.19px",
          width: "319px",
          height: "32.02px",
          boxSizing: "border-box",
          backgroundColor: "transparent",
          padding: "0px 0px 0px 35px",
          wordWrap: "break-word"
        }}><p style={{
            textAlign: "left",
            lineHeight: "1.92",
            fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
            marginTop: "0",
            marginBottom: "0"
          }}><span style={{
              fontSize: "calc(19.5pt * var(--pptx-font-scale, 1))",
              fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
              color: "#D1FAE5"
            }}>{"+880 1771144221"}</span></p></div></div><img key={7} src={img_4} alt="Website Icon, Transparent Website.PNG Images & Vector - FreeIconsPNG" style={{
        position: "absolute",
        left: "480.05px",
        top: "456.22px",
        width: "23.99px",
        height: "23.99px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={8} src={img_5} alt="Email PNG Download, Email Logo, Icon, Email Symbol, @ PNG - Free ..." style={{
        position: "absolute",
        left: "475.46px",
        top: "502.36px",
        width: "28.8px",
        height: "28.8px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={9} src={img_6} alt="Call Icon, Contact Mark, Message Alert, Dialer Graphic, Connection ..." style={{
        position: "absolute",
        left: "477.65px",
        top: "552.98px",
        width: "28.8px",
        height: "28.8px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={10} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={11} src={img_7} alt="Picture 8" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide15;
