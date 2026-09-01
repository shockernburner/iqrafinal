import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_3.png";
import img_3 from "./assets/images/image_21.png";
import img_4 from "./assets/images/image_22.png";
import img_5 from "./assets/images/image_23.png";
import img_6 from "./assets/images/image_24.png";
import img_7 from "./assets/images/image_8.png";
const Slide6: React.FC = () => {
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
  return <div id="slide-6" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-6" style={{
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
        width: "103px",
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
          }}>{"05 / 15"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "60px",
        top: "230.22px",
        width: "1160px",
        height: "412.39px",
        boxSizing: "border-box",
        backgroundColor: "#064E3B",
        border: "1px solid #4A7DBA",
        borderRadius: "0px",
        boxShadow: "0px 2.41px 4.2px rgba(0, 0, 0, 0.35)"
      }} /><table key={4} style={{
        position: "absolute",
        left: "60px",
        top: "229.18px",
        width: "1159px",
        height: "412.39px",
        borderCollapse: "collapse",
        tableLayout: "fixed"
      }}><colgroup><col style={{
            width: "70%"
          }} /><col style={{
            width: "30%"
          }} /></colgroup><tbody><tr style={{
            height: "82.48px"
          }}><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "18pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"BUILT"}</span></p></td><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "18pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"STATUS"}</span></p></td></tr><tr style={{
            height: "82.48px"
          }}><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  color: "#0d0d0d"
                }}>{"Live web app + installable PWA, secure accounts, multi-thread chat"}</span></p></td><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"Live at "}</span><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"iqra.live"}</span><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{" & "}</span><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"iqra.chat"}</span></p></td></tr><tr style={{
            height: "82.48px"
          }}><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  color: "#0d0d0d"
                }}>{"Knowledge base of 3,00,000+ classical source documents"}</span></p></td><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"Ingested"}</span></p></td></tr><tr style={{
            height: "82.48px"
          }}><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  color: "#0d0d0d"
                }}>{"2000+ curated scholar-style Q&A pairs guiding answer quality"}</span></p></td><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"Active"}</span></p></td></tr><tr style={{
            height: "82.48px"
          }}><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  color: "#0d0d0d"
                }}>{"Donations, admin knowledge management, growth analytics"}</span></p></td><td style={{
              padding: "4px 8px",
              verticalAlign: "top",
              fontSize: "15pt",
              backgroundColor: "#FBBF24"
            }}><p style={{
                textAlign: "center",
                lineHeight: "1.2",
                fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                marginTop: "0",
                marginBottom: "0"
              }}><span style={{
                  fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
                  fontWeight: "700",
                  color: "#0d0d0d"
                }}>{"Operational"}</span></p></td></tr></tbody></table><div key={5} style={{
        position: "absolute",
        left: "60.5px",
        top: "335.69px",
        width: "811.3px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={6} style={{
        position: "absolute",
        left: "871.8px",
        top: "335.69px",
        width: "347.7px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={7} style={{
        position: "absolute",
        left: "60.5px",
        top: "416.69px",
        width: "811.3px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={8} style={{
        position: "absolute",
        left: "871.8px",
        top: "416.69px",
        width: "347.7px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={9} style={{
        position: "absolute",
        left: "60.5px",
        top: "497.69px",
        width: "811.3px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={10} style={{
        position: "absolute",
        left: "871.8px",
        top: "497.69px",
        width: "347.7px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={11} style={{
        position: "absolute",
        left: "60.5px",
        top: "578.69px",
        width: "811.3px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={12} style={{
        position: "absolute",
        left: "871.8px",
        top: "578.69px",
        width: "347.7px",
        height: "1px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><img key={13} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "901.8px",
        top: "341.35px",
        width: "20px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={14} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "901.8px",
        top: "425.45px",
        width: "18px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={15} src={img_5} alt="image.png" style={{
        position: "absolute",
        left: "901.8px",
        top: "509.54px",
        width: "18px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={16} src={img_6} alt="image.png" style={{
        position: "absolute",
        left: "901.8px",
        top: "591.57px",
        width: "20px",
        height: "20px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={17} style={{
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
          }}>{"TRACTION"}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "60px",
        top: "132px",
        width: "1160px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={19} style={{
        position: "absolute",
        left: "60px",
        top: "152.32px",
        width: "849.42px",
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
          }}>{"A working product already answers grounded questions today"}</span></p></div><div key={20} style={{
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
          }}>{". All rights reserved"}</span></p></div><img key={21} src={img_7} alt="Picture 4" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide6;
