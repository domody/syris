import { Redirect, RedirectConfig } from "expo-router";
import { PageWrap } from "@/components/common/page-wrap";

export default function Add() {

    return (
        <Redirect href={"/scan/barcode"} />
    )
}