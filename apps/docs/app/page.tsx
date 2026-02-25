"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { source } from "@/lib/source";
// import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";

const art = String.raw`
                        ....  ..-=-:.:-*%%*.    .*%%*-:.:-=-..  ...                         
                     .:%@@@@@+...-@@@@@@@@@%.  .%@@@@@@@@@-...+@@@@@%:                      
                    =@@@@@@@@@@@+..-+#%@@@@@.. .@@@@@%#*-..+@@@@@@@@@@@=                    
                  .%@@@@@@@@@@@@@@@@%*+-:.-#:. :#-.:-+*%@@@@@@@@@@@@@@@@%.                  
                  +@@@@@@@@@@@@@@@@@@@@@@@@=.. .-@@@@@@@@@@@@@@@@@@@@@@@@+                  
               ...+@@@@@@@@@@@@@#=.:+@@@@@@@#..#@@@@@@@+:.=#@@@@@@@@@@@@@+  .               
            .=@@@:.+%@@@@@@@@@@@@@@@-.%@@@@@-. -@@@@@%.-@@@@@@@@@@@@@@@%+.:@@@=.            
            :@@@@+::..-@@@@@@@@@@@@@@%:.::..    ..::.:%@@@@@@@@@@@@@@-..::+@@@@:            
            -@@@@@@@@@-+@@@@@@@@@@@@@@@@@@@@: .:@@@@@@@@@@@@@@@@@@@@+-@@@@@@@@@-            
        .-#=.=@@@@@@@@@::+@@@@@@@@@@@@@@@@@@%..%@@@@@@@@@@@@@@@@@@+::@@@@@@@@@=.=#-.        
      .=@@@@#:..*@@@@@#.#@@@@@@@@@@=...-*@@@*..*@@@*-...=@@@@@@@@@@#.#@@@@@*..:#@@@@=.      
      +@@@@@@@%.+@@@@*.#@@@@@@@@@@@@@@%=.. .    ....=%@@@@@@@@@@@@@@#.*@@@@+.%@@@@@@@+      
    .-@@@@@@@@=.%@@@@-:%@@@@@@@@@@@@@@@@@@#.    .#@@@@@@@@@@@@@@@@@@%:-@@@@%.=@@@@@@@@-     
    .*@@@@@@@+.*@@@@@*.#@@@@@%@@@@@@@@@@@@@@-. -@@@@@@@@@@@@@@%@@@@@#.*@@@@@*.+@@@@@@@*     
     =@@@@@@@::@@@@@@@*.+%%+:%@@@@@@@@@@@@@@#..#@@@@@@@@@@@@@@%:+%%+.*@@@@@@@::@@@@@@@=.    
     .@@@@@@@-=@@@@@@@@@@**@@@@@@@@@@@@@@@@@%..%@@@@@@@@@@@@@@@@@**@@@@@@@@@@=-@@@@@@@.     
    ..-@@@@@@@:+@@@@@@@@@@@@@@@@@@@@@@@@@@@@+..+@@@@@@@@@@@@@@@@@@@@@@@@@@@@+:@@@@@@@-..    
  :#@@:-@@@@@*....=@@@#+=-+@@@@@@@@@@@@@@@@#.  .#@@@@@@@@@@@@@@@@+-=+#@@@=....*@@@@@-:@@#:  
.-@@@@*.-@@@=.%@@%.=...:--..:#@@@@@@@@@@@@+.    .+@@@@@@@@@@@@#:..--:...=.%@@%.=@@@-.*@@@@-.
.=@@@*.%@@@+:%@@@@#.%@@@@@@@- .=@@@@@@@@+.        .=@@@@@@@@=..-@@@@@@@%.#@@@@%:+@@@%.*@@@=.
 .:%@@.#@@%.#@@@@@@@@@@@@@@@@%:  .......              .....  :%@@@@@@@@@@@@@@@@#.%@@#.@@%:. 
  -@@@*.@@=-@@@@@@@@@@@@@@@%+:  .:+#%@@@%*:.    .:*%@@@%#+-.  .+%@@@@@@@@@@@@@@@-=@@.*@@@-  
  :@@@%.#@.#@@@@@@@@@@@@%=--=*%@@@@@@@@@@@@%.  .%@@@@@@@@@@@@%*=--=%@@@@@@@@@@@@#.@#:%@@@:  
  ..#@*:@#.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=  =@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.#@:#@#..  
    *#.%@*.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+.  .+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.*@%.#*.   
   .=.#@@#.#@@@@@@@@@@@@@@@@@@@@@+++==-:.        ...:-==+++@@@@@@@@@@@@@@@@@@@@@#.#@@#.=.   
    .%@@@@.-@@@@@@@+.....#@@@@@@@@@@@@@@@@*.    .*@@@@@@@@@@@@@@@@#.....+@@@@@@@-.@@@@%.    
    *@@@@* .=@@@@+...#@@#.:@@@@@@@@@@@@@@@@%.  .%@@@@@@@@@@@@@@@@:.#@@#...+@@@@=..*@@@@*.   
  ..@@@@%:-- .--...*@@@@@@:=@@@@@@@@@@@@@@@@:  :@@@@@@@@@@@@@@@@=:@@@@@@*. .--. --:%@@@@..  
   .@@@@+.@@+...-#@@@@@@@@#.@@@@@@@@@@@@@@@@.  .@@@@@@@@@@@@@@@@.#@@@@@@@@#-...+@@.+@@@@..  
    :@@@--@@@@@@@@@@@@@@@@@=@@@@@@@@@@@@@@@*    *@@@@@@@@@@@@@@@=@@@@@@@@@@@@@@@@@--@@@:    
      .::.@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%.    .%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@.::..     
      =-..:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=.      .=@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:..-=.     
      *@@=...+%%@@@@@@@@@@@@@@@@@@@@@@%=.:#.    .#:.=%@@@@@@@@@@@@@@@@@@@@@@%%+. .=@@*.     
      ..@@@@#+-::::.#@@@@@@@@@@@@@@#:..*@@@=    =@@@*..:#@@@@@@@@@@@@@@#.::::-+#@@@@..      
       =@@@@@@@@@@@*.-*%@@@%#*=-:..=#@@@@@@%.  .%@@@@@@#=..:-=*#%@@@%*-.*@@@@@@@@@@@=       
       -@@@@@@@@@@@@@%+=---=+*%@#.=@@@@@@@@@-. -@@@@@@@@@=.#@%*+=---=+%@@@@@@@@@@@@@-       
        #@@@@@@@@@@@@@@@@@@@@@@@:.%@@@@@@@@@=. =@@@@@@@@@%.:@@@@@@@@@@@@@@@@@@@@@@@#.       
        :%@@@@@@@@@@@@@@@@@@@@+.:%@@@@@@@@@@:  :@@@@@@@@@@%:.+@@@@@@@@@@@@@@@@@@@@%:        
         .+@@@@@@@@@@@@@@+....-%@@@@@@@@@@@+.  .+@@@@@@@@@@@%-....*@@@@@@@@@@@@@@+..        
            .=#%@@@%%#=....*@@@@@@@@@@@@@@+.    .+@@@@@@@@@@@@@@*....=#%%@@@%#=.            
                          .#@@@@@@@@@@@@%.        .%@@@@@@@@@@@@#.                          
                           ..:=*%%%#*=:..           .:=*#%%%*=:..                           
`;

export default function Page() {
  return (
    <div className="w-screen min-h-screen pt-4 pb-6 md:pb-12 flex flex-col">
      <div className="relative isolate flex min-h-[600px] h-[70vh] max-h-[900px] border rounded-2xl overflow-hidden mx-auto w-full container bg-origin-border">
        <BackgroundLayers />
        {/* <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: "url('/gradient-bg.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 pointer-events-none mix-blend-multiply opacity-[0.1]"
          style={{
            backgroundImage: "url('/noise-texture.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "2000px 2000px",
            backgroundPosition: "center",
          }}
        /> */}

        <div className="size-full z-2 flex flex-col px-4 md:p-12 max-md:items-center max-md:text-center">
          <pre className="font-mono text-sm text-sidebar-primary leading-none tracking-tighter whitespace w-min overflow-hidden rounded absolute max-md:hidden -right-[20%] md:translate-x-0 -bottom-[10%] ">
            {art}
          </pre>
          <Badge variant={"secondary"} className="mt-12">
            v3 redesign
          </Badge>
          <h1 className="text-4xl my-4 mb-0 leading-tight font-medium xl:text-5xl">
            SYRIS v3 Documentation
          </h1>
          <p className="text-sm text-muted-foreground max-w-1/2 my-4 xl:text-base xl:mb-8">
            Baseline architecture, contracts, runbooks, and decisions for the
            SYRIS core - built for fast paths, durable workflows, and
            dashboard-first observability.
          </p>
          <div className="flex flex-row items-center justify-center gap-4 flex-wrap w-fit">
            <Link href={"/docs"} className={buttonVariants({ size: "lg" })}>
              Start Here
            </Link>
            <Link
              href={"/docs/architecture/system-design-v3"}
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              View Architecture
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BackgroundLayers() {
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    const gradient = new Image();
    const noise = new Image();

    let loadedCount = 0;

    const handleLoad = () => {
      loadedCount += 1;
      if (loadedCount === 2) {
        setReady(true);
      }
    };

    gradient.onload = handleLoad;
    noise.onload = handleLoad;

    gradient.src = "/gradient-bg.svg";
    noise.src = "/noise-texture.png";
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${
          ready ? "opacity-50" : "opacity-0"
        }`}
        style={{
          backgroundImage: "url('/gradient-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-1 pointer-events-none mix-blend-multiply transition-opacity duration-1000 ${
          ready ? "opacity-[0.1]" : "opacity-0"
        }`}
        style={{
          backgroundImage: "url('/noise-texture.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "2000px 2000px",
          backgroundPosition: "center",
        }}
      />
    </>
  );
}
